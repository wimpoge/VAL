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


_GTM_MOTIONS = ("PLG", "API-first", "Vertical SaaS")
_PRICING_MODELS = ("per-token", "per-seat", "usage tiers", "outcome-based")


# ───────────────────────────────────────────────────────────────────
# POST /ask — single-language AI-product tutor
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


_ASK_SYSTEM = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Today's topic is AI products and business: pricing models "
    "(per-token, per-seat, usage tiers, outcome-based), GTM strategy "
    "(PLG, API-first, vertical SaaS), the demo trap (why a great demo "
    "rarely becomes a great product), responsible AI practices, and "
    "case studies (Cursor, Harvey, Perplexity, ElevenLabs, Glean). "
    "Be opinionated and concrete — name specific products and numbers "
    "when relevant. Reply in the same language as the question. No "
    "markdown headers, no preamble."
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
        day="day19",
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
# POST /product-critique — tough-but-fair AI product critic
# ───────────────────────────────────────────────────────────────────

class IdeaRequest(BaseModel):
    idea: str
    provider: str | None = None


_CRITIQUE_SYSTEM = (
    "You are a tough-but-fair AI product critic. The user pitches an "
    "AI product idea in one or two sentences. Return a structured "
    "critique that calls out the failure modes, picks a pricing "
    "model + GTM motion with reasons, and grades viability.\n\n"
    "Reply ONLY as JSON with this exact shape:\n"
    "{\n"
    "  \"demo_trap\": \"why this could look great in a demo but break in "
    "prod — be specific (max 280 chars)\",\n"
    "  \"pricing_model\": \"per-token | per-seat | usage tiers | "
    "outcome-based\",\n"
    "  \"pricing_reason\": \"one sentence on why this pricing fits "
    "(max 220 chars)\",\n"
    "  \"gtm_motion\": \"PLG | API-first | Vertical SaaS\",\n"
    "  \"gtm_reason\": \"one sentence on why this GTM motion fits "
    "(max 220 chars)\",\n"
    "  \"safety_concern\": \"the most realistic harm or misuse — be "
    "concrete (max 280 chars)\",\n"
    "  \"viability_score\": integer 1-10,\n"
    "  \"viability_reason\": \"one or two sentences justifying the "
    "score (max 400 chars)\"\n"
    "}\n\n"
    "Rules:\n"
    "  - pricing_model must be one of: per-token, per-seat, "
    "usage tiers, outcome-based\n"
    "  - gtm_motion must be one of: PLG, API-first, Vertical SaaS\n"
    "  - viability_score: 1-3 = doomed; 4-6 = real concerns; "
    "7-8 = solid; 9-10 = obvious winner (use 9-10 sparingly)\n"
    "  - Be honest — easy 8/10 scores undercut the whole exercise.\n"
    "  - No markdown, no extra keys, no commentary."
)


def _clamp_int(v, lo: int, hi: int, default: int) -> int:
    try:
        n = int(v)
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, n))


def _clamp_enum(v, allowed: tuple, default: str) -> str:
    s = str(v).strip()
    for opt in allowed:
        if s.lower() == opt.lower():
            return opt
    return default


@router.post("/product-critique")
def product_critique(req: IdeaRequest):
    idea = req.idea.strip()
    if not idea:
        raise HTTPException(status_code=400, detail="idea is required")
    if len(idea) > 600:
        raise HTTPException(
            status_code=400,
            detail="idea must be 600 characters or fewer",
        )

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    user_msg = f"Critique this idea:\n\n{idea}\n\nReturn the JSON now."

    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _CRITIQUE_SYSTEM},
                {"role": "user", "content": user_msg},
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

    demo_trap = str(parsed.get("demo_trap", "")).strip()[:320]
    pricing_model = _clamp_enum(
        parsed.get("pricing_model"), _PRICING_MODELS, "per-token"
    )
    pricing_reason = str(parsed.get("pricing_reason", "")).strip()[:260]
    gtm_motion = _clamp_enum(
        parsed.get("gtm_motion"), _GTM_MOTIONS, "API-first"
    )
    gtm_reason = str(parsed.get("gtm_reason", "")).strip()[:260]
    safety_concern = str(parsed.get("safety_concern", "")).strip()[:320]
    viability_score = _clamp_int(parsed.get("viability_score"), 1, 10, 5)
    viability_reason = str(parsed.get("viability_reason", "")).strip()[:480]

    pt, ct = _usage(completion)
    track(
        day="day19",
        endpoint="/product-critique",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "idea": idea,
        "demo_trap": demo_trap,
        "pricing_model": pricing_model,
        "pricing_reason": pricing_reason,
        "gtm_motion": gtm_motion,
        "gtm_reason": gtm_reason,
        "safety_concern": safety_concern,
        "viability_score": viability_score,
        "viability_reason": viability_reason,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": prov,
        "model": model,
    }
