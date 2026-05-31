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


# ───────────────────────────────────────────────────────────────────
# POST /ask — single-language observability tutor
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


_ASK_SYSTEM = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Today's topic is LLM observability and evaluation: LangSmith, "
    "Langfuse, RAGAS, Weights & Biases Weave, and OpenTelemetry for "
    "LLMs. Focus on how to trace LLM calls, score outputs automatically, "
    "and catch regressions before they reach users. Reply in the same "
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
        day="day15",
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
# POST /eval-score — LLM-as-judge RAGAS-style scorer
# ───────────────────────────────────────────────────────────────────

class EvalRequest(BaseModel):
    question: str
    context: str
    answer: str
    provider: str | None = None


_EVAL_SYSTEM = (
    "You are an LLM-as-judge evaluator scoring an answer against a "
    "retrieved context, RAGAS-style. Score each metric from 0.0 to 1.0:\n"
    "  faithfulness — is every claim in the answer grounded in the "
    "context? Hallucinations drop this.\n"
    "  answer_relevancy — does the answer directly address the question, "
    "without dodging or wandering?\n"
    "  context_precision — does the context actually contain the "
    "information needed to answer? Noisy/off-topic context drops this.\n\n"
    "Reply ONLY as JSON with this exact shape:\n"
    "{\"faithfulness\": 0.0, \"answer_relevancy\": 0.0, "
    "\"context_precision\": 0.0, \"explanation\": \"one short paragraph\"}\n"
    "Rules: all three scores are floats in [0.0, 1.0]. explanation is one "
    "or two plain sentences explaining the weakest metric. No markdown, "
    "no extra keys."
)


def _clamp_score(v) -> float:
    try:
        x = float(v)
    except (TypeError, ValueError):
        return 0.0
    if x != x:
        return 0.0
    return max(0.0, min(1.0, x))


def _verdict_from_scores(scores: list[float]) -> str:
    if all(s >= 0.7 for s in scores):
        return "pass"
    if any(s < 0.4 for s in scores):
        return "fail"
    return "warn"


@router.post("/eval-score")
def eval_score(req: EvalRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")
    if not req.context.strip():
        raise HTTPException(status_code=400, detail="context is required")
    if not req.answer.strip():
        raise HTTPException(status_code=400, detail="answer is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    user_msg = (
        f"QUESTION:\n{req.question}\n\n"
        f"CONTEXT:\n{req.context}\n\n"
        f"ANSWER:\n{req.answer}\n\n"
        "Score the answer now and return the JSON."
    )

    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _EVAL_SYSTEM},
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

    faithfulness = _clamp_score(parsed.get("faithfulness"))
    answer_relevancy = _clamp_score(parsed.get("answer_relevancy"))
    context_precision = _clamp_score(parsed.get("context_precision"))
    explanation = str(parsed.get("explanation", ""))[:600]

    verdict = _verdict_from_scores(
        [faithfulness, answer_relevancy, context_precision]
    )

    pt, ct = _usage(completion)
    track(
        day="day15",
        endpoint="/eval-score",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "faithfulness": faithfulness,
        "answer_relevancy": answer_relevancy,
        "context_precision": context_precision,
        "explanation": explanation,
        "verdict": verdict,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": prov,
        "model": model,
    }
