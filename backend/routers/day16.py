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


_USE_CASES = (
    "simple_chain",
    "doc_qa",
    "stateful_agent",
    "multi_agent",
    "raw_api",
)
_COMPLEXITIES = ("low", "medium", "high")
_REACT_STEP_TYPES = ("Thought", "Action", "Observation")
_AGENT_USE_CASES = ("stateful_agent", "multi_agent")


# ───────────────────────────────────────────────────────────────────
# POST /ask — single-language LLM-frameworks tutor
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


_ASK_SYSTEM = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Today's topic is LLM orchestration frameworks: LangChain (LCEL + "
    "agents), LlamaIndex, LangGraph, and CrewAI. Focus on what each is "
    "best for, how they relate, and when raw API calls are still the "
    "right answer. Reply in the same language as the question. No "
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
        day="day16",
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
# POST /framework-picker — recommend a framework for a use case
# ───────────────────────────────────────────────────────────────────

class FrameworkPickerRequest(BaseModel):
    use_case: str
    provider: str | None = None


_PICKER_SYSTEM = (
    "You are an LLM-framework consultant. Given a use case, recommend "
    "the single best framework or approach. Be opinionated.\n\n"
    "Valid frameworks: LangChain (LCEL), LangChain agents, LlamaIndex, "
    "LangGraph, CrewAI, raw OpenAI SDK (no framework).\n\n"
    "Reply ONLY as JSON with this exact shape:\n"
    "{\n"
    "  \"framework\": \"name of the recommended framework\",\n"
    "  \"reason\": \"one or two plain sentences explaining the pick\",\n"
    "  \"alternatives\": [\"alt 1\", \"alt 2\"],\n"
    "  \"complexity\": \"low\" | \"medium\" | \"high\",\n"
    "  \"react_loop_steps\": null OR [\n"
    "    {\"step\": \"Thought\", \"example\": \"...\"},\n"
    "    {\"step\": \"Action\", \"example\": \"tool_name(args)\"},\n"
    "    {\"step\": \"Observation\", \"example\": \"...\"},\n"
    "    ... (4 to 6 steps total, ending with a final Thought + answer)\n"
    "  ]\n"
    "}\n\n"
    "Rules:\n"
    "  - complexity must be one of: low, medium, high\n"
    "  - alternatives: 2 or 3 entries, short framework names only\n"
    "  - react_loop_steps: include ONLY if the use case is a stateful or "
    "multi-agent system; otherwise null\n"
    "  - When included, each step.step is exactly one of: Thought, "
    "Action, Observation\n"
    "  - Action examples should look like tool calls: "
    "search_web(\"...\"), calculate(\"2+2\"), get_weather(\"SF\")\n"
    "  - No markdown, no extra keys, no commentary."
)


_USE_CASE_BLURB = {
    "simple_chain": (
        "a simple linear pipeline: prompt -> LLM -> output parser. "
        "No tools, no state, no agents."
    ),
    "doc_qa": (
        "document Q&A over a corpus: ingest PDFs/HTML, chunk + embed, "
        "retrieve, answer. Standard RAG."
    ),
    "stateful_agent": (
        "a single agent that loops over tools (search, calculate, "
        "etc.) until it can answer. Stateful between steps."
    ),
    "multi_agent": (
        "multiple specialized agents handing off tasks: e.g. "
        "researcher -> writer -> reviewer."
    ),
    "raw_api": (
        "a one-shot call to an LLM API with no orchestration. The user "
        "is asking when to skip frameworks entirely."
    ),
}


def _normalize_react_steps(raw, use_case: str):
    """Drop react_loop_steps unless the use case is agent-shaped, and
    clamp each step to the allowed enum + a 200-char example."""
    if use_case not in _AGENT_USE_CASES:
        return None
    if not isinstance(raw, list) or not raw:
        return None
    out = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        step = str(item.get("step", "")).strip().title()
        if step not in _REACT_STEP_TYPES:
            continue
        example = str(item.get("example", ""))[:200]
        out.append({"step": step, "example": example})
        if len(out) >= 8:
            break
    return out or None


@router.post("/framework-picker")
def framework_picker(req: FrameworkPickerRequest):
    use_case = req.use_case.strip()
    if use_case not in _USE_CASES:
        raise HTTPException(
            status_code=400,
            detail=f"use_case must be one of: {', '.join(_USE_CASES)}",
        )

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    user_msg = (
        f"Use case: {use_case} ({_USE_CASE_BLURB[use_case]})\n\n"
        "Recommend the single best framework now and return the JSON."
    )

    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _PICKER_SYSTEM},
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

    framework = str(parsed.get("framework", "")).strip()[:80] or "(no recommendation)"
    reason = str(parsed.get("reason", "")).strip()[:600]

    raw_alts = parsed.get("alternatives") or []
    alternatives: list[str] = []
    if isinstance(raw_alts, list):
        for a in raw_alts:
            s = str(a).strip()[:60]
            if s:
                alternatives.append(s)
            if len(alternatives) >= 4:
                break

    complexity = str(parsed.get("complexity", "")).strip().lower()
    if complexity not in _COMPLEXITIES:
        complexity = "medium"

    react_loop_steps = _normalize_react_steps(
        parsed.get("react_loop_steps"), use_case
    )

    pt, ct = _usage(completion)
    track(
        day="day16",
        endpoint="/framework-picker",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "use_case": use_case,
        "framework": framework,
        "reason": reason,
        "alternatives": alternatives,
        "complexity": complexity,
        "react_loop_steps": react_loop_steps,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": prov,
        "model": model,
    }
