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


_ARCHITECTURES = ("simple", "rag", "agent")
_COMPLEXITIES = ("weekend", "1-week", "1-month")


# ───────────────────────────────────────────────────────────────────
# POST /ask — single-language capstone tutor
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


_ASK_SYSTEM = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Today is the capstone day — the learner has completed Days 1-19 "
    "covering tokens, embeddings, prompting, RAG, agents, MCP, "
    "multimodal, vector DBs, ML frameworks, cloud platforms, local "
    "inference, observability, LLM frameworks, production deployment, "
    "advanced AI, and AI business. Be encouraging and forward-looking. "
    "Help them plan their first real project. Reply in the same "
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
        day="day20",
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
# POST /stack-picker — recommend a full stack from 5 requirements
# ───────────────────────────────────────────────────────────────────

class StackRequest(BaseModel):
    needs_multimodal: bool = False
    needs_own_docs: bool = False
    needs_agents: bool = False
    needs_local: bool = False
    needs_scale: bool = False
    provider: str | None = None


_STACK_SYSTEM = (
    "You are an AI engineering consultant. Given a set of requirement "
    "booleans, recommend the simplest stack that satisfies them. Bias "
    "toward boring proven choices — Next.js + FastAPI + a managed "
    "provider beats clever frameworks for v1.\n\n"
    "Reply ONLY as JSON with this exact shape:\n"
    "{\n"
    "  \"architecture\": \"simple\" | \"rag\" | \"agent\",\n"
    "  \"frontend\": \"name of one frontend choice\",\n"
    "  \"backend\": \"name of one backend choice\",\n"
    "  \"vector_db\": null OR \"name of one vector DB\",\n"
    "  \"llm_provider\": \"name of one LLM provider\",\n"
    "  \"local_runtime\": null OR \"name of one local runtime\",\n"
    "  \"reason\": \"two or three sentences justifying the picks "
    "(max 500 chars)\",\n"
    "  \"days_to_revisit\": [integer days 1-20, max 5 entries],\n"
    "  \"estimated_complexity\": \"weekend\" | \"1-week\" | \"1-month\"\n"
    "}\n\n"
    "Rules:\n"
    "  - architecture: 'simple' (one-shot LLM call), 'rag' (retrieval + "
    "LLM), 'agent' (tool-using loop). Pick agent only if "
    "needs_agents=true; rag if needs_own_docs=true; simple otherwise.\n"
    "  - vector_db: must be null when architecture='simple' or "
    "needs_own_docs=false\n"
    "  - local_runtime: must be null when needs_local=false; otherwise "
    "one of Ollama, vLLM, TGI, llama.cpp, LM Studio\n"
    "  - estimated_complexity scales with the number of requirements: "
    "0-1 → weekend; 2-3 → 1-week; 4-5 → 1-month\n"
    "  - days_to_revisit: integers in [1, 20]; pick the days most "
    "relevant to the requirements\n"
    "  - No markdown, no extra keys, no commentary."
)


_STACK_NOTE = {
    "needs_multimodal": (
        "needs_multimodal=true — must handle images / audio / video as input or output. "
        "Pull in Day 10 multimodal patterns."
    ),
    "needs_own_docs": (
        "needs_own_docs=true — RAG over user-provided documents. "
        "Pull in Day 6 embeddings + Day 7 vector DBs + Day 8 RAG."
    ),
    "needs_agents": (
        "needs_agents=true — tool use / multi-step reasoning. "
        "Pull in Day 9 + Day 16."
    ),
    "needs_local": (
        "needs_local=true — must run without cloud LLM dependency. "
        "Pull in Day 14 local inference."
    ),
    "needs_scale": (
        "needs_scale=true — production traffic, multi-tenant. "
        "Pull in Day 11 + Day 15 + Day 17."
    ),
}


def _clamp_enum(v, allowed: tuple, default: str) -> str:
    s = str(v).strip()
    for opt in allowed:
        if s.lower() == opt.lower():
            return opt
    return default


def _clamp_optional_str(v, max_len: int) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    if not s or s.lower() in ("null", "none", "n/a", "-"):
        return None
    return s[:max_len]


def _clamp_revisit(raw) -> list[int]:
    if not isinstance(raw, list):
        return []
    out: list[int] = []
    seen: set[int] = set()
    for item in raw:
        try:
            n = int(item)
        except (TypeError, ValueError):
            continue
        if 1 <= n <= 20 and n not in seen:
            out.append(n)
            seen.add(n)
        if len(out) >= 6:
            break
    return out


def _expected_complexity(req: StackRequest) -> str:
    flags = sum(
        [
            req.needs_multimodal,
            req.needs_own_docs,
            req.needs_agents,
            req.needs_local,
            req.needs_scale,
        ]
    )
    if flags <= 1:
        return "weekend"
    if flags <= 3:
        return "1-week"
    return "1-month"


def _expected_architecture(req: StackRequest) -> str:
    if req.needs_agents:
        return "agent"
    if req.needs_own_docs:
        return "rag"
    return "simple"


@router.post("/stack-picker")
def stack_picker(req: StackRequest):
    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    flags = [
        f"  - needs_multimodal: {req.needs_multimodal}",
        f"  - needs_own_docs: {req.needs_own_docs}",
        f"  - needs_agents: {req.needs_agents}",
        f"  - needs_local: {req.needs_local}",
        f"  - needs_scale: {req.needs_scale}",
    ]
    notes = [
        _STACK_NOTE[k]
        for k, on in (
            ("needs_multimodal", req.needs_multimodal),
            ("needs_own_docs", req.needs_own_docs),
            ("needs_agents", req.needs_agents),
            ("needs_local", req.needs_local),
            ("needs_scale", req.needs_scale),
        )
        if on
    ]
    user_msg = (
        "Requirements:\n"
        + "\n".join(flags)
        + (
            "\n\nRelevant context:\n" + "\n".join(f"  - {n}" for n in notes)
            if notes
            else ""
        )
        + "\n\nReturn the JSON now."
    )

    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _STACK_SYSTEM},
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

    # Architecture is rule-derived but we let the model speak; if it disagrees
    # with the deterministic answer (e.g. picks 'rag' when needs_agents=true)
    # the rule wins so the rest of the UI stays consistent.
    architecture = _clamp_enum(
        parsed.get("architecture"), _ARCHITECTURES, _expected_architecture(req)
    )
    if req.needs_agents:
        architecture = "agent"
    elif req.needs_own_docs and architecture == "simple":
        architecture = "rag"

    complexity = _clamp_enum(
        parsed.get("estimated_complexity"),
        _COMPLEXITIES,
        _expected_complexity(req),
    )

    frontend = str(parsed.get("frontend", "")).strip()[:80] or "Next.js"
    backend = str(parsed.get("backend", "")).strip()[:80] or "FastAPI"
    llm_provider = (
        str(parsed.get("llm_provider", "")).strip()[:80] or "OpenAI"
    )

    vector_db = _clamp_optional_str(parsed.get("vector_db"), 80)
    if architecture == "simple" or not req.needs_own_docs:
        vector_db = None

    local_runtime = _clamp_optional_str(parsed.get("local_runtime"), 80)
    if not req.needs_local:
        local_runtime = None

    reason = str(parsed.get("reason", "")).strip()[:560]
    days_to_revisit = _clamp_revisit(parsed.get("days_to_revisit"))

    pt, ct = _usage(completion)
    track(
        day="day20",
        endpoint="/stack-picker",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "inputs": {
            "needs_multimodal": req.needs_multimodal,
            "needs_own_docs": req.needs_own_docs,
            "needs_agents": req.needs_agents,
            "needs_local": req.needs_local,
            "needs_scale": req.needs_scale,
        },
        "architecture": architecture,
        "frontend": frontend,
        "backend": backend,
        "vector_db": vector_db,
        "llm_provider": llm_provider,
        "local_runtime": local_runtime,
        "reason": reason,
        "days_to_revisit": days_to_revisit,
        "estimated_complexity": complexity,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": prov,
        "model": model,
    }
