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


_CONCEPTS = ("lora", "rlhf", "dpo", "alignment", "quantization")
_COMPLEXITIES = ("medium", "high")

# Display titles used as a server-side fallback when the model omits the
# title field. Keeps the UI stable even when the JSON is partially missing.
_CONCEPT_TITLES = {
    "lora": "LoRA / QLoRA",
    "rlhf": "RLHF",
    "dpo": "DPO",
    "alignment": "AI Alignment & Safety",
    "quantization": "Quantization & Compression",
}


# ───────────────────────────────────────────────────────────────────
# POST /ask — single-language advanced-topics tutor
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


_ASK_SYSTEM = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Today's topic is advanced AI: fine-tuning with LoRA / QLoRA, "
    "RLHF, DPO, AI alignment and safety (Constitutional AI, reward "
    "hacking), and model quantization. These are genuinely complex "
    "topics — use simple analogies, stay accurate, and don't paper "
    "over the parts that are actually hard. Reply in the same "
    "language as the question. No markdown headers, no preamble."
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
        day="day18",
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
# POST /explain-concept — structured beginner explanation
# ───────────────────────────────────────────────────────────────────

class ConceptRequest(BaseModel):
    concept: str
    provider: str | None = None


_EXPLAIN_SYSTEM = (
    "You explain advanced ML concepts to a beginner who has built "
    "basic LLM apps but never trained a model. Be accurate, use one "
    "concrete analogy, and break the mechanism into 3-5 numbered "
    "steps that fit on a card.\n\n"
    "Reply ONLY as JSON with this exact shape:\n"
    "{\n"
    "  \"title\": \"short canonical name of the concept\",\n"
    "  \"one_line\": \"single-sentence definition (max 160 chars)\",\n"
    "  \"analogy\": \"one concrete real-world analogy (max 280 chars)\",\n"
    "  \"steps\": [\n"
    "    {\"label\": \"short step name\", \"description\": \"1-2 sentences\"},\n"
    "    ... (3 to 5 entries total)\n"
    "  ],\n"
    "  \"complexity\": \"medium\" | \"high\",\n"
    "  \"why_it_matters\": \"one short paragraph on practical impact (max 400 chars)\"\n"
    "}\n\n"
    "Rules:\n"
    "  - complexity must be one of: medium, high\n"
    "  - steps: 3 to 5 entries; label max 40 chars, description max 220 chars\n"
    "  - No markdown headers in any field, no extra keys, no commentary."
)


_CONCEPT_PROMPTS = {
    "lora": (
        "Explain LoRA (Low-Rank Adaptation) and how QLoRA extends it. Focus "
        "on the A·B low-rank matrices injected per layer, the frozen base "
        "weights, and why this updates ~1% of parameters."
    ),
    "rlhf": (
        "Explain RLHF (Reinforcement Learning from Human Feedback) in three "
        "stages: supervised fine-tuning, reward-model training on human "
        "preference pairs, and PPO with a KL penalty against the SFT model."
    ),
    "dpo": (
        "Explain DPO (Direct Preference Optimization): how it skips the "
        "explicit reward model and the PPO loop and instead optimizes a "
        "single loss directly on (chosen, rejected) preference pairs."
    ),
    "alignment": (
        "Explain AI alignment and safety for a beginner: reward hacking / "
        "specification gaming, Constitutional AI (self-critique + revision), "
        "and why RLHF alone is not sufficient alignment."
    ),
    "quantization": (
        "Explain model quantization: how FP32 → BF16 → INT8 → INT4 lowers "
        "memory and increases throughput, what quality loss looks like at "
        "each tier, and the gist of GPTQ / AWQ / GGUF Q4."
    ),
}


def _clamp_steps(raw) -> list[dict]:
    if not isinstance(raw, list):
        return []
    out: list[dict] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        label = str(item.get("label", "")).strip()[:40]
        desc = str(item.get("description", "")).strip()[:220]
        if not label and not desc:
            continue
        out.append({"label": label, "description": desc})
        if len(out) >= 6:
            break
    return out


@router.post("/explain-concept")
def explain_concept(req: ConceptRequest):
    concept = req.concept.strip().lower()
    if concept not in _CONCEPTS:
        raise HTTPException(
            status_code=400,
            detail=f"concept must be one of: {', '.join(_CONCEPTS)}",
        )

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    user_msg = _CONCEPT_PROMPTS[concept] + "\n\nReturn the JSON now."

    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _EXPLAIN_SYSTEM},
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

    title = (
        str(parsed.get("title", "")).strip()[:80]
        or _CONCEPT_TITLES[concept]
    )
    one_line = str(parsed.get("one_line", "")).strip()[:200]
    analogy = str(parsed.get("analogy", "")).strip()[:320]
    why = str(parsed.get("why_it_matters", "")).strip()[:480]
    steps = _clamp_steps(parsed.get("steps"))

    complexity = str(parsed.get("complexity", "")).strip().lower()
    if complexity not in _COMPLEXITIES:
        # Default to "high" for the hardest ones, "medium" otherwise.
        complexity = "high" if concept in ("rlhf", "alignment") else "medium"

    pt, ct = _usage(completion)
    track(
        day="day18",
        endpoint="/explain-concept",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "concept": concept,
        "title": title,
        "one_line": one_line,
        "analogy": analogy,
        "steps": steps,
        "complexity": complexity,
        "why_it_matters": why,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": prov,
        "model": model,
    }
