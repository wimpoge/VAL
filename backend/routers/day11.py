import json
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from provider import BEGINNER_SYSTEM_PROMPT, get_client, get_model, get_provider
from token_tracker import track

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


_ENGINES = ("FAISS", "ChromaDB", "Qdrant", "Weaviate", "Pinecone")
_VALID_TYPES = ("embedded", "self-hosted", "managed")


# ───────────────────────────────────────────────────────────────────
# POST /ask — single-language explainer about vector DB engines
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


_ASK_SYSTEM = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Today's topic is vector database engines: FAISS, ChromaDB, Qdrant, "
    "Weaviate, Pinecone. Focus on when to choose each, their trade-offs, "
    "and how they differ. Reply in the same language as the question. "
    "No markdown headers, no preamble."
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
        day="day11",
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
# POST /compare — model-generated 5-axis comparison of all five engines
# ───────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    provider: str | None = None


_COMPARE_SYSTEM = (
    "You are a vector-database analyst. Compare FAISS, ChromaDB, Qdrant, "
    "Weaviate, and Pinecone on five numeric axes (each scored 1–5, where 5 "
    "is strongest):\n"
    "  - managed         (1 = pure library, 5 = fully managed cloud)\n"
    "  - filter_support  (1 = none, 5 = rich metadata + hybrid filters)\n"
    "  - scale           (1 = single laptop, 5 = global-scale distributed)\n"
    "  - cost_efficiency (1 = expensive at scale, 5 = cheapest)\n"
    "  - setup_ease      (1 = hard to operate, 5 = pip install and go)\n\n"
    "Also include:\n"
    "  - type    : one of 'embedded' | 'self-hosted' | 'managed'\n"
    "  - best_for: one short phrase (max 10 words)\n\n"
    "Reply ONLY as JSON with exactly this shape:\n"
    "{\"engines\": [\n"
    "  {\"name\": \"FAISS\", \"type\": \"...\", \"managed\": N, "
    "\"filter_support\": N, \"scale\": N, \"cost_efficiency\": N, "
    "\"setup_ease\": N, \"best_for\": \"...\"},\n"
    "  ... (five entries total, in this exact order: FAISS, ChromaDB, "
    "Qdrant, Weaviate, Pinecone)\n"
    "]}\n"
    "No markdown, no extra keys, no commentary."
)


def _normalize_engine(item: dict) -> dict:
    name = str(item.get("name", "")).strip()
    type_ = str(item.get("type", "")).strip().lower()
    if type_ not in _VALID_TYPES:
        type_ = "self-hosted"

    def _score(key: str) -> int:
        try:
            v = int(item.get(key, 0))
        except (TypeError, ValueError):
            v = 0
        return max(1, min(5, v))

    return {
        "name": name,
        "type": type_,
        "managed": _score("managed"),
        "filter_support": _score("filter_support"),
        "scale": _score("scale"),
        "cost_efficiency": _score("cost_efficiency"),
        "setup_ease": _score("setup_ease"),
        "best_for": str(item.get("best_for", ""))[:120],
    }


@router.post("/compare")
def compare(req: CompareRequest):
    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _COMPARE_SYSTEM},
                {
                    "role": "user",
                    "content": (
                        "Compare the five engines now and return the JSON."
                    ),
                },
            ],
        )
    except Exception as e:
        raise _fail(prov, e)
    latency_ms = int((time.perf_counter() - t0) * 1000)

    content = completion.choices[0].message.content or "{}"
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        parsed = {}

    raw_engines = parsed.get("engines")
    if not isinstance(raw_engines, list):
        raw_engines = []

    # Index returned engines by name so we can render them in the
    # canonical order even if the model shuffled or dropped a row.
    by_name: dict[str, dict] = {}
    for item in raw_engines:
        if not isinstance(item, dict):
            continue
        normalized = _normalize_engine(item)
        if normalized["name"]:
            by_name[normalized["name"]] = normalized

    engines = []
    for canonical in _ENGINES:
        engines.append(
            by_name.get(canonical)
            or {
                "name": canonical,
                "type": "self-hosted",
                "managed": 0,
                "filter_support": 0,
                "scale": 0,
                "cost_efficiency": 0,
                "setup_ease": 0,
                "best_for": "(no data returned)",
            }
        )

    pt, ct = _usage(completion)
    track(
        day="day11",
        endpoint="/compare",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "engines": engines,
        "axes": [
            "managed",
            "filter_support",
            "scale",
            "cost_efficiency",
            "setup_ease",
        ],
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": prov,
        "model": model,
    }
