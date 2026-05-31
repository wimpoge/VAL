import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from provider import BEGINNER_SYSTEM_PROMPT, get_client, get_model, get_provider
from token_tracker import RATES, track

router = APIRouter()


# ───────────────────────────────────────────────────────────────────
# Shared helpers
# ───────────────────────────────────────────────────────────────────

def _usage(completion) -> tuple[int, int]:
    u = completion.usage
    return (u.prompt_tokens if u else 0, u.completion_tokens if u else 0)


def _fail(prov: str, e: Exception) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail=f"{prov} call failed: {type(e).__name__}: {e}",
    )


# ───────────────────────────────────────────────────────────────────
# POST /ask — single-language production-deployment tutor
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


_ASK_SYSTEM = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Today's topic is production deployment of AI apps: Docker "
    "multi-stage builds, CI/CD with GitHub Actions, cost optimization "
    "(model routing, semantic caching, prompt compression), health "
    "checks and monitoring, and zero-downtime deployment (blue/green, "
    "rolling updates, PM2 reload). Reply in the same language as the "
    "question. No markdown headers, no preamble."
)


@router.post("/ask")
def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _ASK_SYSTEM},
                {"role": "user", "content": req.question},
            ],
        )
    except Exception as e:
        raise _fail(prov, e)
    latency_ms = int((time.perf_counter() - t0) * 1000)

    pt, ct = _usage(completion)
    track(
        day="day17",
        endpoint="/ask",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "question": req.question,
        "answer": completion.choices[0].message.content or "",
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# POST /cost-estimate — pure math, no LLM call
# ───────────────────────────────────────────────────────────────────

class CostRequest(BaseModel):
    monthly_requests: int = Field(..., ge=1, le=1_000_000_000)
    avg_input_tokens: int = Field(..., ge=1, le=200_000)
    avg_output_tokens: int = Field(..., ge=0, le=200_000)


def _chat_model_rates() -> list[tuple[str, str, float, float]]:
    """Pull (provider, model, input_rate, output_rate) for every chat-style
    model in RATES. Skip flat-rate models (DALL-E, gpt-image-1) and
    embeddings (output rate of 0 means no completion tokens are billed)."""
    out: list[tuple[str, str, float, float]] = []
    for prov, models in RATES.items():
        for model, r in models.items():
            if "input" not in r or "output" not in r:
                continue
            inp = float(r["input"])
            outp = float(r["output"])
            if outp <= 0:
                continue
            out.append((prov, model, inp, outp))
    return out


@router.post("/cost-estimate")
def cost_estimate(req: CostRequest):
    rows = _chat_model_rates()
    if not rows:
        raise HTTPException(
            status_code=500,
            detail="no chat-model rates configured",
        )

    estimates = []
    for prov, model, inp_rate, out_rate in rows:
        monthly = (
            req.monthly_requests * req.avg_input_tokens / 1_000_000 * inp_rate
            + req.monthly_requests * req.avg_output_tokens / 1_000_000 * out_rate
        )
        per_req = monthly / req.monthly_requests if req.monthly_requests else 0.0
        estimates.append(
            {
                "provider": prov,
                "model": model,
                "monthly_cost_usd": round(monthly, 4),
                "cost_per_request_usd": round(per_req, 8),
                "input_rate_per_mtok_usd": inp_rate,
                "output_rate_per_mtok_usd": out_rate,
            }
        )

    estimates.sort(key=lambda e: e["monthly_cost_usd"])

    cheapest = estimates[0]
    most_expensive = estimates[-1]
    if most_expensive["monthly_cost_usd"] > 0:
        savings_pct = (
            (most_expensive["monthly_cost_usd"] - cheapest["monthly_cost_usd"])
            / most_expensive["monthly_cost_usd"]
            * 100.0
        )
    else:
        savings_pct = 0.0

    return {
        "estimates": estimates,
        "cheapest": cheapest["provider"],
        "cheapest_model": cheapest["model"],
        "most_expensive": most_expensive["provider"],
        "most_expensive_model": most_expensive["model"],
        "savings_vs_most_expensive_pct": round(savings_pct, 2),
        "inputs": {
            "monthly_requests": req.monthly_requests,
            "avg_input_tokens": req.avg_input_tokens,
            "avg_output_tokens": req.avg_output_tokens,
        },
    }
