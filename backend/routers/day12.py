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


_FRAMEWORKS = (
    # hardware
    "CUDA",
    "Metal",
    "ROCm",
    "XLA",
    # low_level
    "PyTorch",
    "TensorFlow",
    # high_level
    "Keras",
    # hub
    "HuggingFace Hub",
    # runtime
    "Transformers",
    "ONNX Runtime",
    "llama.cpp",
)
_VALID_LAYERS = ("hardware", "low_level", "high_level", "hub", "runtime")
_VALID_COLORS = ("blue", "teal", "amber", "purple", "coral", "grey")


# ───────────────────────────────────────────────────────────────────
# POST /ask — single-language ML frameworks tutor
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


_ASK_SYSTEM = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Today's topic is ML frameworks: PyTorch, TensorFlow / Keras, HuggingFace "
    "Hub, the Transformers library, and ONNX Runtime. Focus on how they relate "
    "to each other (low-level vs high-level vs hub vs runtime), when to use "
    "each, and beginner-friendly analogies. Reply in the same language as the "
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
        day="day12",
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
# POST /framework-map — layered ecosystem map
# ───────────────────────────────────────────────────────────────────

class MapRequest(BaseModel):
    provider: str | None = None


_MAP_SYSTEM = (
    "You are an ML-frameworks analyst. Describe the modern Python ML "
    "ecosystem as a stack of layers and emit a JSON map of the major "
    "frameworks. Use EXACTLY these eleven items, assigned to the layers "
    "shown:\n"
    "  hardware   : CUDA, Metal, ROCm, XLA\n"
    "  low_level  : PyTorch, TensorFlow\n"
    "  high_level : Keras\n"
    "  hub        : HuggingFace Hub\n"
    "  runtime    : Transformers, ONNX Runtime, llama.cpp\n\n"
    "Reply ONLY as JSON with this exact shape:\n"
    "{\"frameworks\": [\n"
    "  {\"name\": \"PyTorch\", \"layer\": \"low_level\", "
    "\"use_case\": \"short phrase\", "
    "\"runs_on_top_of\": [\"...\"], "
    "\"color_hint\": \"blue\"},\n"
    "  ... (eleven entries total: CUDA, Metal, ROCm, XLA, PyTorch, "
    "TensorFlow, Keras, HuggingFace Hub, Transformers, ONNX Runtime, "
    "llama.cpp)\n"
    "]}\n"
    "Rules:\n"
    "  - layer must be one of: hardware, low_level, high_level, hub, runtime\n"
    "  - color_hint must be one of: blue, teal, amber, purple, coral, grey\n"
    "  - use_case max 10 words\n"
    "  - Every hardware item (CUDA, Metal, ROCm, XLA) MUST have "
    "runs_on_top_of: [] (empty array — hardware sits at the bottom of "
    "the stack and depends on nothing inside this map).\n"
    "  - Every other item MUST list what it runs on top of, using only "
    "names from this same eleven-item list. For example, PyTorch might "
    "list [\"CUDA\", \"Metal\", \"ROCm\"]; Keras might list "
    "[\"TensorFlow\"]; Transformers might list [\"PyTorch\", \"TensorFlow\"].\n"
    "  - No markdown, no extra keys, no commentary."
)


def _normalize_framework(item: dict) -> dict:
    name = str(item.get("name", "")).strip()
    layer = str(item.get("layer", "")).strip().lower()
    if layer not in _VALID_LAYERS:
        layer = "low_level"

    color = str(item.get("color_hint", "")).strip().lower()
    if color not in _VALID_COLORS:
        color = "grey"

    raw_runs = item.get("runs_on_top_of", [])
    if not isinstance(raw_runs, list):
        raw_runs = []
    runs_on_top_of = [str(x).strip() for x in raw_runs if isinstance(x, str)]

    return {
        "name": name,
        "layer": layer,
        "use_case": str(item.get("use_case", ""))[:120],
        "runs_on_top_of": runs_on_top_of,
        "color_hint": color,
    }


@router.post("/framework-map")
def framework_map(req: MapRequest):
    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _MAP_SYSTEM},
                {
                    "role": "user",
                    "content": (
                        "Build the framework ecosystem map now and return "
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

    raw = parsed.get("frameworks")
    if not isinstance(raw, list):
        raw = []

    by_name: dict[str, dict] = {}
    for item in raw:
        if not isinstance(item, dict):
            continue
        norm = _normalize_framework(item)
        if norm["name"]:
            by_name[norm["name"]] = norm

    frameworks = []
    for canonical in _FRAMEWORKS:
        frameworks.append(
            by_name.get(canonical)
            or {
                "name": canonical,
                "layer": "low_level",
                "use_case": "(no data returned)",
                "runs_on_top_of": [],
                "color_hint": "grey",
            }
        )

    pt, ct = _usage(completion)
    track(
        day="day12",
        endpoint="/framework-map",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "frameworks": frameworks,
        "layers": list(_VALID_LAYERS),
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": prov,
        "model": model,
    }
