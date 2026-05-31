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


_RUNTIMES = ("Ollama", "vLLM", "TGI", "llama.cpp", "LM Studio")
_SETUP_LEVELS = ("easy", "medium", "advanced")
_THROUGHPUT_LEVELS = ("low", "medium", "high")


# ───────────────────────────────────────────────────────────────────
# POST /ask — single-language local-inference tutor
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


_ASK_SYSTEM = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Today's topic is local LLM inference: Ollama, vLLM, TGI, llama.cpp, "
    "and LM Studio. Focus on setup complexity, throughput, GPU "
    "requirements, quantization support, and when to use each. Note: this "
    "app teaches these as concepts — the live Q&A is answered by the "
    "user's chosen cloud provider (OpenAI / Groq / DeepSeek / Gemini), "
    "not by a local model. Reply in the same language as the question. "
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
        day="day14",
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
# POST /runtime-compare — 5-runtime comparison matrix
# ───────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    provider: str | None = None


_COMPARE_SYSTEM = (
    "You are a local-LLM-runtime analyst. Compare these five inference "
    "runtimes on consistent dimensions. Use EXACTLY these five items "
    "in this canonical order: Ollama, vLLM, TGI, llama.cpp, LM Studio.\n\n"
    "Reply ONLY as JSON with this exact shape:\n"
    "{\"runtimes\": [\n"
    "  {\"name\": \"Ollama\", \"setup\": \"easy\", "
    "\"throughput\": \"medium\", \"gpu_required\": false, "
    "\"gui\": false, \"api_compatible\": true, "
    "\"quantization_support\": true, "
    "\"ram_8gb\": true, \"ram_16gb\": true, "
    "\"best_for\": \"short phrase\"},\n"
    "  ... (five entries total, in the order above)\n"
    "]}\n"
    "Rules:\n"
    "  - setup must be one of: easy, medium, advanced\n"
    "  - throughput must be one of: low, medium, high\n"
    "  - gpu_required, gui, api_compatible (OpenAI-compatible API), "
    "quantization_support, ram_8gb (runs 7B model on 8 GB RAM), "
    "ram_16gb (runs 13B model on 16 GB RAM) are booleans\n"
    "  - best_for max 12 words\n"
    "  - No markdown, no extra keys, no commentary."
)


def _as_bool(v) -> bool:
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.strip().lower() in ("true", "yes", "1")
    return bool(v)


def _normalize_runtime(item: dict) -> dict:
    name = str(item.get("name", "")).strip()

    setup = str(item.get("setup", "")).strip().lower()
    if setup not in _SETUP_LEVELS:
        setup = "medium"

    throughput = str(item.get("throughput", "")).strip().lower()
    if throughput not in _THROUGHPUT_LEVELS:
        throughput = "medium"

    return {
        "name": name,
        "setup": setup,
        "throughput": throughput,
        "gpu_required": _as_bool(item.get("gpu_required", False)),
        "gui": _as_bool(item.get("gui", False)),
        "api_compatible": _as_bool(item.get("api_compatible", False)),
        "quantization_support": _as_bool(item.get("quantization_support", False)),
        "ram_8gb": _as_bool(item.get("ram_8gb", False)),
        "ram_16gb": _as_bool(item.get("ram_16gb", False)),
        "best_for": str(item.get("best_for", ""))[:120],
    }


@router.post("/runtime-compare")
def runtime_compare(req: CompareRequest):
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
                        "Build the five-runtime comparison now and return "
                        "the JSON."
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

    raw = parsed.get("runtimes")
    if not isinstance(raw, list):
        raw = []

    by_name: dict[str, dict] = {}
    for item in raw:
        if not isinstance(item, dict):
            continue
        norm = _normalize_runtime(item)
        if norm["name"]:
            by_name[norm["name"]] = norm

    runtimes = []
    for canonical in _RUNTIMES:
        runtimes.append(
            by_name.get(canonical)
            or {
                "name": canonical,
                "setup": "medium",
                "throughput": "medium",
                "gpu_required": False,
                "gui": False,
                "api_compatible": False,
                "quantization_support": False,
                "ram_8gb": False,
                "ram_16gb": False,
                "best_for": "(no data returned)",
            }
        )

    pt, ct = _usage(completion)
    track(
        day="day14",
        endpoint="/runtime-compare",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "runtimes": runtimes,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": prov,
        "model": model,
    }
