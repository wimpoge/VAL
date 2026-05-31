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


_PLATFORMS = (
    "AWS Bedrock",
    "GCP Vertex AI",
    "Azure OpenAI",
    "Alibaba DashScope",
    "Kaggle",
    "Google Colab",
)

_VENDOR_COLORS = ("orange", "blue", "indigo", "red", "green", "cyan")
_PRICING_MODELS = ("per-token", "per-seat", "usage-based", "free")

# Default vendor color per canonical platform name. Used as a fallback
# when the model returns an unknown color so the UI palette stays stable.
_DEFAULT_VENDOR_COLOR = {
    "AWS Bedrock": "orange",
    "GCP Vertex AI": "blue",
    "Azure OpenAI": "indigo",
    "Alibaba DashScope": "red",
    "Kaggle": "cyan",
    "Google Colab": "green",
}


# ───────────────────────────────────────────────────────────────────
# POST /ask — single-language cloud-platforms tutor
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


_ASK_SYSTEM = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Today's topic is cloud AI platforms: AWS Bedrock, GCP Vertex AI, "
    "Azure OpenAI, Alibaba DashScope, Kaggle, and Google Colab. Focus on "
    "when to choose each, pricing model, and compliance strengths. "
    "Note: this app teaches these as concepts — the live Q&A is answered "
    "by the user's chosen provider (OpenAI / Groq / DeepSeek / Gemini), "
    "not by the cloud platform itself. Reply in the same language as the "
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
        day="day13",
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
# POST /platform-compare — six-platform comparison matrix
# ───────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    provider: str | None = None


_COMPARE_SYSTEM = (
    "You are a cloud-AI analyst. Compare these six platforms on a few "
    "consistent dimensions. Use EXACTLY these six items, with the canonical "
    "vendor colors shown:\n"
    "  AWS Bedrock        : vendor=AWS,     vendor_color=orange\n"
    "  GCP Vertex AI      : vendor=GCP,     vendor_color=blue\n"
    "  Azure OpenAI       : vendor=Azure,   vendor_color=indigo\n"
    "  Alibaba DashScope  : vendor=Alibaba, vendor_color=red\n"
    "  Kaggle             : vendor=Google,  vendor_color=cyan\n"
    "  Google Colab       : vendor=Google,  vendor_color=green\n\n"
    "Reply ONLY as JSON with this exact shape:\n"
    "{\"platforms\": [\n"
    "  {\"name\": \"AWS Bedrock\", \"vendor\": \"AWS\", "
    "\"vendor_color\": \"orange\", \"managed\": true, "
    "\"free_tier\": false, "
    "\"openai_compatible\": false, "
    "\"compliance\": [\"SOC2\", \"HIPAA\"], "
    "\"best_for\": \"short phrase\", "
    "\"pricing_model\": \"per-token\"},\n"
    "  ... (six entries total, in this exact order: AWS Bedrock, "
    "GCP Vertex AI, Azure OpenAI, Alibaba DashScope, Kaggle, Google Colab)\n"
    "]}\n"
    "Rules:\n"
    "  - vendor_color must be one of: orange, blue, indigo, red, green, cyan\n"
    "  - pricing_model must be one of: per-token, per-seat, usage-based, free\n"
    "  - managed, free_tier, openai_compatible are booleans\n"
    "  - compliance is an array of short strings, e.g. SOC2, HIPAA, ISO27001, "
    "GDPR, FedRAMP, PCI-DSS. Use [] for notebook platforms with no "
    "compliance story.\n"
    "  - best_for max 12 words\n"
    "  - No markdown, no extra keys, no commentary."
)


def _as_bool(v) -> bool:
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.strip().lower() in ("true", "yes", "1")
    return bool(v)


def _normalize_platform(item: dict) -> dict:
    name = str(item.get("name", "")).strip()
    vendor = str(item.get("vendor", "")).strip()
    color = str(item.get("vendor_color", "")).strip().lower()
    if color not in _VENDOR_COLORS:
        color = _DEFAULT_VENDOR_COLOR.get(name, "blue")

    pricing = str(item.get("pricing_model", "")).strip().lower()
    if pricing not in _PRICING_MODELS:
        pricing = "usage-based"

    raw_comp = item.get("compliance", [])
    if not isinstance(raw_comp, list):
        raw_comp = []
    compliance = [
        str(x).strip()[:24] for x in raw_comp if isinstance(x, str)
    ][:6]

    return {
        "name": name,
        "vendor": vendor or _DEFAULT_VENDOR_COLOR.get(name, ""),
        "vendor_color": color,
        "managed": _as_bool(item.get("managed", False)),
        "free_tier": _as_bool(item.get("free_tier", False)),
        "openai_compatible": _as_bool(item.get("openai_compatible", False)),
        "compliance": compliance,
        "best_for": str(item.get("best_for", ""))[:120],
        "pricing_model": pricing,
    }


@router.post("/platform-compare")
def platform_compare(req: CompareRequest):
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
                        "Build the six-platform comparison now and return "
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

    raw = parsed.get("platforms")
    if not isinstance(raw, list):
        raw = []

    by_name: dict[str, dict] = {}
    for item in raw:
        if not isinstance(item, dict):
            continue
        norm = _normalize_platform(item)
        if norm["name"]:
            by_name[norm["name"]] = norm

    platforms = []
    for canonical in _PLATFORMS:
        platforms.append(
            by_name.get(canonical)
            or {
                "name": canonical,
                "vendor": "",
                "vendor_color": _DEFAULT_VENDOR_COLOR.get(canonical, "blue"),
                "managed": False,
                "free_tier": False,
                "openai_compatible": False,
                "compliance": [],
                "best_for": "(no data returned)",
                "pricing_model": "usage-based",
            }
        )

    pt, ct = _usage(completion)
    track(
        day="day13",
        endpoint="/platform-compare",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "platforms": platforms,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": prov,
        "model": model,
    }
