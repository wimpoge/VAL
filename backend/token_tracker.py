from datetime import datetime, timezone

import psycopg2
from fastapi import APIRouter

from db import get_conn

RATES = {
    "openai": {
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "text-embedding-3-small": {"input": 0.02, "output": 0.0},
        "dall-e-2": {"flat": 0.0018},
        # gpt-image-1 is billed per quality tier. We pin the in-tracker rate
        # to the "low" tier we use by default; high/medium calls will
        # under-count cost (acceptable for a demo).
        "gpt-image-1": {"flat": 0.011},
    },
    "groq": {
        "llama-3.1-8b-instant": {"input": 0.05, "output": 0.08},
    },
    "deepseek": {
        "deepseek-chat": {"input": 0.27, "output": 1.10},
    },
    "gemini": {
        "gemini-2.5-flash-lite": {"input": 0.10, "output": 0.40},
    },
}


def _empty_provider_bucket() -> dict:
    return {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
        "cost_usd": 0.0,
        "calls": 0,
    }


_totals = {
    "total_tokens": 0,
    "total_cost_usd": 0.0,
    "call_count": 0,
    "by_provider": {p: _empty_provider_bucket() for p in RATES.keys()},
    "calls": [],
}

_rehydrated_ok = False


def _rehydrate_from_db() -> None:
    """Rebuild in-memory totals from persisted token_usage rows.

    Why: _totals only lives in memory; a uvicorn --reload (or any backend
    restart) would otherwise zero the navbar counter even though Postgres
    still has every call on disk. Retries on every get_summary() call until
    the DB pool is reachable.
    """
    global _rehydrated_ok
    if _rehydrated_ok:
        return
    with get_conn() as conn:
        if conn is None:
            return
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                      provider,
                      COALESCE(SUM(prompt_tokens), 0),
                      COALESCE(SUM(completion_tokens), 0),
                      COALESCE(SUM(total_tokens), 0),
                      COALESCE(SUM(cost_usd), 0),
                      COUNT(*)
                    FROM token_usage
                    GROUP BY provider
                    """
                )
                rows = cur.fetchall()
        except psycopg2.Error:
            return

    _totals["total_tokens"] = 0
    _totals["total_cost_usd"] = 0.0
    _totals["call_count"] = 0
    for p in list(_totals["by_provider"].keys()):
        _totals["by_provider"][p] = _empty_provider_bucket()

    for provider, prompt_t, comp_t, total_t, cost, calls in rows:
        bucket = _totals["by_provider"].setdefault(
            provider, _empty_provider_bucket()
        )
        bucket["prompt_tokens"] = int(prompt_t)
        bucket["completion_tokens"] = int(comp_t)
        bucket["total_tokens"] = int(total_t)
        bucket["cost_usd"] = float(cost)
        bucket["calls"] = int(calls)
        _totals["total_tokens"] += int(total_t)
        _totals["total_cost_usd"] += float(cost)
        _totals["call_count"] += int(calls)

    _rehydrated_ok = True


def _calc_cost(provider: str, model: str, prompt_tokens: int, completion_tokens: int) -> float:
    rates = RATES.get(provider, {}).get(model)
    if rates is None:
        return 0.0
    if "flat" in rates:
        return float(rates["flat"]) * max(prompt_tokens, 1)
    input_rate = rates.get("input", 0.0)
    output_rate = rates.get("output", 0.0)
    return (prompt_tokens / 1_000_000) * input_rate + (completion_tokens / 1_000_000) * output_rate


def track(
    day: str,
    endpoint: str,
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> None:
    cost = _calc_cost(provider, model, prompt_tokens, completion_tokens)
    total_tokens = prompt_tokens + completion_tokens

    _totals["total_tokens"] += total_tokens
    _totals["total_cost_usd"] += cost
    _totals["call_count"] += 1

    bucket = _totals["by_provider"].setdefault(provider, _empty_provider_bucket())
    bucket["prompt_tokens"] += prompt_tokens
    bucket["completion_tokens"] += completion_tokens
    bucket["total_tokens"] += total_tokens
    bucket["cost_usd"] += cost
    bucket["calls"] += 1

    record = {
        "day": day,
        "endpoint": endpoint,
        "provider": provider,
        "model": model,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "cost_usd": cost,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _totals["calls"].append(record)
    if len(_totals["calls"]) > 100:
        _totals["calls"] = _totals["calls"][-100:]

    _persist(
        day=day,
        endpoint=endpoint,
        provider=provider,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        cost_usd=cost,
    )


def _persist(
    *,
    day: str,
    endpoint: str,
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    cost_usd: float,
) -> None:
    with get_conn() as conn:
        if conn is None:
            return
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO token_usage
                      (day, endpoint, provider, model,
                       prompt_tokens, completion_tokens, total_tokens, cost_usd)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        day,
                        endpoint,
                        provider,
                        model,
                        prompt_tokens,
                        completion_tokens,
                        total_tokens,
                        cost_usd,
                    ),
                )
            conn.commit()
        except psycopg2.Error:
            try:
                conn.rollback()
            except psycopg2.Error:
                pass


def get_summary() -> dict:
    _rehydrate_from_db()
    return {
        "total_tokens": _totals["total_tokens"],
        "total_cost_usd": _totals["total_cost_usd"],
        "call_count": _totals["call_count"],
        "by_provider": {p: dict(b) for p, b in _totals["by_provider"].items()},
        "calls": list(_totals["calls"]),
    }


tracker_router = APIRouter()


@tracker_router.get("/tokens")
def tokens_summary():
    return get_summary()


@tracker_router.delete("/tokens/reset")
def tokens_reset():
    _totals["total_tokens"] = 0
    _totals["total_cost_usd"] = 0.0
    _totals["call_count"] = 0
    for p in _totals["by_provider"]:
        _totals["by_provider"][p] = _empty_provider_bucket()
    _totals["calls"] = []
    with get_conn() as conn:
        if conn is not None:
            try:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM token_usage")
                conn.commit()
            except psycopg2.Error:
                try:
                    conn.rollback()
                except psycopg2.Error:
                    pass
    return {"message": "reset ok"}


@tracker_router.get("/usage/daily")
def usage_daily(days: int = 30):
    days = max(1, min(days, 365))
    with get_conn() as conn:
        if conn is None:
            return {"days": days, "rows": [], "available": False}
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                      to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS bucket,
                      provider,
                      COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
                      COALESCE(SUM(completion_tokens), 0) AS completion_tokens,
                      COALESCE(SUM(total_tokens), 0) AS total_tokens,
                      COALESCE(SUM(cost_usd), 0) AS cost_usd,
                      COUNT(*) AS calls
                    FROM token_usage
                    WHERE created_at >= NOW() - (%s::int * INTERVAL '1 day')
                    GROUP BY bucket, provider
                    ORDER BY bucket DESC, provider ASC
                    """,
                    (days,),
                )
                rows = [
                    {
                        "date": r[0],
                        "provider": r[1],
                        "prompt_tokens": int(r[2]),
                        "completion_tokens": int(r[3]),
                        "total_tokens": int(r[4]),
                        "cost_usd": float(r[5]),
                        "calls": int(r[6]),
                    }
                    for r in cur.fetchall()
                ]
        except psycopg2.Error:
            return {"days": days, "rows": [], "available": False}
    return {"days": days, "rows": rows, "available": True}


@tracker_router.get("/usage/monthly")
def usage_monthly(months: int = 6):
    months = max(1, min(months, 60))
    with get_conn() as conn:
        if conn is None:
            return {"months": months, "rows": [], "available": False}
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                      to_char(date_trunc('month', created_at), 'YYYY-MM') AS bucket,
                      provider,
                      COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
                      COALESCE(SUM(completion_tokens), 0) AS completion_tokens,
                      COALESCE(SUM(total_tokens), 0) AS total_tokens,
                      COALESCE(SUM(cost_usd), 0) AS cost_usd,
                      COUNT(*) AS calls
                    FROM token_usage
                    WHERE created_at >= date_trunc('month', NOW()) - (%s::int * INTERVAL '1 month')
                    GROUP BY bucket, provider
                    ORDER BY bucket DESC, provider ASC
                    """,
                    (months - 1,),
                )
                rows = [
                    {
                        "month": r[0],
                        "provider": r[1],
                        "prompt_tokens": int(r[2]),
                        "completion_tokens": int(r[3]),
                        "total_tokens": int(r[4]),
                        "cost_usd": float(r[5]),
                        "calls": int(r[6]),
                    }
                    for r in cur.fetchall()
                ]
        except psycopg2.Error:
            return {"months": months, "rows": [], "available": False}
    return {"months": months, "rows": rows, "available": True}
