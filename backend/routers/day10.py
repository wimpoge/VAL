import base64
import os
import time
from typing import Optional

import httpx
import openai
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from token_tracker import track

router = APIRouter()


# ───────────────────────────────────────────────────────────────────
# Shared — OpenAI client for vision / image / moderation
# These endpoints are OpenAI-only because the OpenAI-compatible APIs
# of Groq / DeepSeek / Gemini either don't support vision multipart
# inputs, don't expose image generation, or don't have a moderation
# endpoint at all. Per the spec: "No provider switcher — vision /
# image gen are OpenAI only."
# ───────────────────────────────────────────────────────────────────

_VISION_MODEL = "gpt-4o-mini"
_IMAGE_MODEL = "gpt-image-1"
_MODERATION_MODEL = "omni-moderation-latest"
_MAX_IMAGE_BYTES = 4 * 1024 * 1024  # 4 MB
_ALLOWED_SIZES = {"1024x1024", "1024x1536", "1536x1024", "auto"}
_ALLOWED_QUALITIES = {"low", "medium", "high", "auto"}
# Approximate per-image cost at 1024x1024 by quality tier (USD).
# Used for the response surface only; token_tracker pins its rate to "low"
# so navbar totals don't lie when defaults are used.
_QUALITY_COST = {"low": 0.011, "medium": 0.042, "high": 0.167, "auto": 0.042}


def _openai_client() -> openai.OpenAI:
    return openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def _fail(label: str, e: Exception) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail=f"OpenAI {label} call failed: {type(e).__name__}: {e}",
    )


# ───────────────────────────────────────────────────────────────────
# N49 — POST /describe-image
# Accepts either {"image_url": "..."} JSON or a multipart file upload.
# Returns a plain text description (single-language per the project's
# 2026-05-11 policy).
# ───────────────────────────────────────────────────────────────────

_VISION_SYSTEM = (
    "You are a careful image describer. Look at the image and write one "
    "tight paragraph describing what is visible: subjects, setting, mood, "
    "and any notable details. Then on a new line write 'TAGS:' followed by "
    "3–6 lowercase comma-separated keywords. No markdown headers."
)


class DescribeUrlRequest(BaseModel):
    image_url: str
    question: Optional[str] = None


def _run_vision(image_payload: str, question: Optional[str]) -> dict:
    client = _openai_client()
    user_prompt = question.strip() if question and question.strip() else (
        "Describe what you see in this image."
    )

    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=_VISION_MODEL,
            messages=[
                {"role": "system", "content": _VISION_SYSTEM},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_payload},
                        },
                    ],
                },
            ],
        )
    except Exception as e:
        raise _fail("vision", e)
    latency_ms = int((time.perf_counter() - t0) * 1000)

    usage = completion.usage
    pt = usage.prompt_tokens if usage else 0
    ct = usage.completion_tokens if usage else 0
    track(
        day="day10",
        endpoint="/describe-image",
        provider="openai",
        model=_VISION_MODEL,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    answer = completion.choices[0].message.content or ""
    description, tags = _split_description_tags(answer)

    return {
        "description": description,
        "tags": tags,
        "raw": answer,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "total_tokens": pt + ct,
        "latency_ms": latency_ms,
        "provider": "openai",
        "model": _VISION_MODEL,
    }


def _split_description_tags(answer: str) -> tuple[str, list[str]]:
    """Pull a 'TAGS: a, b, c' trailing line out of the model output."""
    lines = answer.strip().splitlines()
    tags: list[str] = []
    body_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.lower().startswith("tags:"):
            raw = stripped.split(":", 1)[1].strip()
            tags = [t.strip().lower() for t in raw.split(",") if t.strip()]
        else:
            body_lines.append(line)
    description = "\n".join(body_lines).strip()
    return description or answer.strip(), tags[:8]


_ALLOWED_IMAGE_MIMES = {"image/png", "image/jpeg", "image/gif", "image/webp"}


def _fetch_image_as_data_url(url: str) -> str:
    """Fetch a remote image and return it as a data URL.

    Why: OpenAI's vision fetcher gets blocked / redirected by some hosts
    (Wikimedia thumb redirectors, hotlink-protected CDNs, anything with
    a non-browser User-Agent block) and reports the failure as a generic
    "unsupported image format" error. Pulling the bytes server-side with
    a real UA and re-encoding as a data URL bypasses the whole class of
    fetch-side failures.
    """
    try:
        with httpx.Client(
            follow_redirects=True,
            timeout=15.0,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (compatible; ValBot/1.0; "
                    "+https://github.com/ai-engineer-roadmap)"
                ),
                "Accept": "image/*",
            },
        ) as client:
            response = client.get(url)
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"could not fetch image: {type(e).__name__}: {e}",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"image host returned HTTP {response.status_code}",
        )

    mime = (response.headers.get("content-type") or "").split(";")[0].strip().lower()
    if mime not in _ALLOWED_IMAGE_MIMES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"unsupported content-type '{mime or '(none)'}'. "
                "Must be one of: image/png, image/jpeg, image/gif, image/webp."
            ),
        )

    raw = response.content
    if len(raw) > _MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"image too large: max {_MAX_IMAGE_BYTES // (1024 * 1024)} MB",
        )

    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:{mime};base64,{b64}"


@router.post("/describe-image")
def describe_image_url(req: DescribeUrlRequest):
    url = (req.image_url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="image_url is required")
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(
            status_code=400,
            detail="image_url must be an http(s) URL. Use /describe-upload "
            "for file uploads.",
        )
    data_url = _fetch_image_as_data_url(url)
    return _run_vision(data_url, req.question)


@router.post("/describe-upload")
async def describe_image_upload(
    file: UploadFile = File(...),
    question: Optional[str] = Form(default=None),
):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty file")
    if len(raw) > _MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"file too large: max {_MAX_IMAGE_BYTES // (1024 * 1024)} MB",
        )

    mime = file.content_type or "image/png"
    if not mime.startswith("image/"):
        raise HTTPException(
            status_code=400, detail=f"unsupported content-type: {mime}"
        )

    b64 = base64.b64encode(raw).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"
    return _run_vision(data_url, question)


# ───────────────────────────────────────────────────────────────────
# N49 — POST /generate-image
# DALL-E 2 image generation. Flat-rate billed via token_tracker
# (prompt_tokens=1 signals 1 image to the flat-rate calculator).
# ───────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    prompt: str
    size: str = "1024x1024"
    quality: str = "low"


@router.post("/generate-image")
def generate_image(req: GenerateRequest):
    prompt = (req.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
    size = req.size if req.size in _ALLOWED_SIZES else "1024x1024"
    quality = req.quality if req.quality in _ALLOWED_QUALITIES else "low"
    if len(prompt) > 1000:
        raise HTTPException(
            status_code=400, detail="prompt too long: max 1000 chars"
        )

    client = _openai_client()
    t0 = time.perf_counter()
    try:
        response = client.images.generate(
            model=_IMAGE_MODEL,
            prompt=prompt,
            size=size,  # type: ignore[arg-type]
            quality=quality,  # type: ignore[arg-type]
            n=1,
        )
    except Exception as e:
        raise _fail("image generation", e)
    latency_ms = int((time.perf_counter() - t0) * 1000)

    track(
        day="day10",
        endpoint="/generate-image",
        provider="openai",
        model=_IMAGE_MODEL,
        prompt_tokens=1,  # flat rate per image, pinned to "low" in tracker
        completion_tokens=0,
    )

    if not response.data:
        raise HTTPException(status_code=502, detail="no image returned")
    item = response.data[0]

    # gpt-image-1 returns base64 by default — convert to a data URL so the
    # frontend <img> can render it without any extra fetch. Fall back to
    # the `url` field if the SDK / model ever changes its mind.
    image_url = getattr(item, "url", None)
    if not image_url:
        b64 = getattr(item, "b64_json", None)
        if b64:
            image_url = f"data:image/png;base64,{b64}"
    if not image_url:
        raise HTTPException(
            status_code=502, detail="image payload missing (no url or b64)"
        )

    return {
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "image_url": image_url,
        "latency_ms": latency_ms,
        "cost_usd": _QUALITY_COST.get(quality, 0.042),
        "provider": "openai",
        "model": _IMAGE_MODEL,
    }


# ───────────────────────────────────────────────────────────────────
# N47 — POST /moderate
# OpenAI moderation API. Returns per-category flags + scores so the
# UI can render a safety dashboard. Free — track() records the call
# at $0 cost since the model is not in token_tracker.RATES.
# ───────────────────────────────────────────────────────────────────

class ModerateRequest(BaseModel):
    text: str


@router.post("/moderate")
def moderate(req: ModerateRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > 4000:
        raise HTTPException(
            status_code=400, detail="text too long: max 4000 chars"
        )

    client = _openai_client()
    t0 = time.perf_counter()
    try:
        response = client.moderations.create(
            model=_MODERATION_MODEL, input=text
        )
    except Exception as e:
        raise _fail("moderation", e)
    latency_ms = int((time.perf_counter() - t0) * 1000)

    if not response.results:
        raise HTTPException(status_code=502, detail="no moderation result")
    res = response.results[0]

    # The categories / category_scores objects from the SDK look like
    # plain attribute bags. Convert to a normalized dict the UI can iterate.
    cats = _as_dict(res.categories)
    scores = _as_dict(res.category_scores)
    rows = sorted(
        (
            {
                "category": k,
                "flagged": bool(cats.get(k, False)),
                "score": float(scores.get(k, 0.0)),
            }
            for k in scores
        ),
        key=lambda r: r["score"],
        reverse=True,
    )

    track(
        day="day10",
        endpoint="/moderate",
        provider="openai",
        model=_MODERATION_MODEL,
        prompt_tokens=0,
        completion_tokens=0,
    )

    return {
        "text": text,
        "flagged": bool(res.flagged),
        "categories": rows,
        "latency_ms": latency_ms,
        "provider": "openai",
        "model": _MODERATION_MODEL,
    }


def _as_dict(obj) -> dict:
    """Normalize OpenAI's pydantic-ish attribute bags into a plain dict."""
    if obj is None:
        return {}
    if isinstance(obj, dict):
        return obj
    if hasattr(obj, "model_dump"):
        try:
            return obj.model_dump()
        except Exception:
            pass
    if hasattr(obj, "dict"):
        try:
            return obj.dict()
        except Exception:
            pass
    return {
        k: getattr(obj, k)
        for k in dir(obj)
        if not k.startswith("_") and not callable(getattr(obj, k, None))
    }
