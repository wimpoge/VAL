import json
import os
import random
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from provider import (
    AVAILABLE_PROVIDERS,
    get_client,
    get_embedding_client,
    get_model,
    get_provider,
)
from token_tracker import track

try:
    import tiktoken

    _HAS_TIKTOKEN = True
except ImportError:
    tiktoken = None
    _HAS_TIKTOKEN = False

router = APIRouter()


class EmbedRequest(BaseModel):
    texts: list[str]


class TokenizeRequest(BaseModel):
    text: str
    provider: str | None = None


class TokenizeCompareRequest(BaseModel):
    text: str


class InferenceRequest(BaseModel):
    prompt: str
    provider: str | None = None
    runs: int = 2


_TOKEN_SPLIT_RE = re.compile(r"\w+|[^\w\s]", re.UNICODE)


def _token_ids_for_provider(
    text: str, provider: str | None
) -> tuple[list[str], list[int], str]:
    try:
        resolved = get_provider(provider)
    except Exception:
        resolved = "openai"

    if resolved == "openai":
        if _HAS_TIKTOKEN and tiktoken is not None:
            enc = tiktoken.encoding_for_model("gpt-4o-mini")
            raw_ids = enc.encode(text)
            tokens = [enc.decode([tid]) for tid in raw_ids]
            return tokens, list(raw_ids), "Real token IDs from OpenAI tiktoken"
        pieces = _TOKEN_SPLIT_RE.findall(text)
        ids = [random.randint(1000, 50000) for _ in pieces]
        return pieces, ids, "tiktoken not installed — simulated IDs"

    pieces = _TOKEN_SPLIT_RE.findall(text)
    ids = [random.randint(1000, 50000) for _ in pieces]
    return (
        pieces,
        ids,
        f"Simulated IDs — {resolved} uses its own tokenizer format, not tiktoken",
    )


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0.0:
        return 0.0
    return float(np.dot(a, b) / denom)


@router.post("/embed")
def embed(req: EmbedRequest):
    if len(req.texts) < 2:
        raise HTTPException(
            status_code=400,
            detail="Provide at least 2 texts: the first is compared against the rest.",
        )

    client = get_embedding_client()
    model = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

    response = client.embeddings.create(model=model, input=req.texts)

    vectors = [np.array(item.embedding, dtype=np.float32) for item in response.data]
    total_tokens = response.usage.total_tokens if response.usage else 0
    dimensions = len(vectors[0]) if vectors else 0

    track(
        day="day02",
        endpoint="/embed",
        provider="openai",
        model=model,
        prompt_tokens=total_tokens,
        completion_tokens=0,
    )

    base = vectors[0]
    ranked = [
        {"text": req.texts[i], "score": _cosine(base, vectors[i])}
        for i in range(1, len(vectors))
    ]
    ranked.sort(key=lambda r: r["score"], reverse=True)

    return {
        "dimensions": dimensions,
        "total_tokens": total_tokens,
        "provider": "openai",
        "similarity_ranking": ranked,
        "texts": req.texts,
        "vectors": [v.tolist() for v in vectors],
    }


@router.post("/tokenize")
def tokenize(req: TokenizeRequest):
    pieces = _TOKEN_SPLIT_RE.findall(req.text)
    char_count = len(req.text)
    word_count = len(req.text.split())
    approx_tokens = max(1, round(char_count / 4)) if char_count else 0

    id_tokens, id_values, id_note = _token_ids_for_provider(req.text, req.provider)

    real_tokens: int | None = None
    real_provider: str | None = None
    real_model: str | None = None

    try:
        client = get_client(req.provider)
        model = get_model(req.provider)
        prov = get_provider(req.provider)
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Echo. Reply with a single dot."},
                {"role": "user", "content": req.text},
            ],
            max_tokens=5,
        )
        usage = completion.usage
        real_tokens = usage.prompt_tokens if usage else None
        real_provider = prov
        real_model = model
        if usage:
            track(
                day="day02",
                endpoint="/tokenize",
                provider=prov,
                model=model,
                prompt_tokens=usage.prompt_tokens,
                completion_tokens=usage.completion_tokens,
            )
    except Exception:
        pass

    return {
        "text": req.text,
        "pieces": pieces,
        "piece_count": len(pieces),
        "word_count": word_count,
        "char_count": char_count,
        "approx_tokens": approx_tokens,
        "real_tokens": real_tokens,
        "provider": real_provider,
        "model": real_model,
        "tokens": id_tokens,
        "ids": id_values,
        "note": id_note,
    }


def _count_for_provider(provider: str, text: str) -> dict:
    try:
        client = get_client(provider)
        model = get_model(provider)
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Echo. Reply with a single dot."},
                {"role": "user", "content": text},
            ],
            max_tokens=5,
        )
        usage = completion.usage
        real = usage.prompt_tokens if usage else None
        if usage:
            track(
                day="day02",
                endpoint="/tokenize/compare",
                provider=provider,
                model=model,
                prompt_tokens=usage.prompt_tokens,
                completion_tokens=usage.completion_tokens,
            )
        return {
            "provider": provider,
            "model": model,
            "real_tokens": real,
            "error": None,
        }
    except Exception as e:
        return {
            "provider": provider,
            "model": get_model(provider) if provider in AVAILABLE_PROVIDERS else None,
            "real_tokens": None,
            "error": f"{type(e).__name__}: {e}",
        }


@router.post("/tokenize/compare")
def tokenize_compare(req: TokenizeCompareRequest):
    char_count = len(req.text)
    word_count = len(req.text.split())
    pieces = _TOKEN_SPLIT_RE.findall(req.text)

    with ThreadPoolExecutor(max_workers=len(AVAILABLE_PROVIDERS)) as pool:
        results = list(
            pool.map(lambda p: _count_for_provider(p, req.text), AVAILABLE_PROVIDERS)
        )

    return {
        "text": req.text,
        "char_count": char_count,
        "word_count": word_count,
        "pieces": pieces,
        "piece_count": len(pieces),
        "results": results,
    }


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/tokenize/compare/stream")
def tokenize_compare_stream(req: TokenizeCompareRequest):
    text = req.text
    char_count = len(text)
    word_count = len(text.split())
    pieces = _TOKEN_SPLIT_RE.findall(text)
    providers = list(AVAILABLE_PROVIDERS)

    def gen():
        yield _sse(
            "init",
            {
                "text": text,
                "char_count": char_count,
                "word_count": word_count,
                "pieces": pieces,
                "piece_count": len(pieces),
                "providers": providers,
            },
        )
        try:
            with ThreadPoolExecutor(max_workers=len(providers)) as pool:
                future_to_provider = {
                    pool.submit(_count_for_provider, p, text): p for p in providers
                }
                for future in as_completed(future_to_provider):
                    result = future.result()
                    yield _sse("result", result)
        except Exception as e:
            yield _sse("error", {"detail": f"{type(e).__name__}: {e}"})
            return
        yield _sse("done", {})

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/inference")
def inference(req: InferenceRequest):
    if req.runs < 1 or req.runs > 5:
        raise HTTPException(status_code=400, detail="runs must be between 1 and 5")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    runs = []
    for i in range(req.runs):
        start = time.perf_counter()
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are concise."},
                    {"role": "user", "content": req.prompt},
                ],
            )
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"{prov} call failed: {type(e).__name__}: {e}",
            )
        elapsed_ms = (time.perf_counter() - start) * 1000.0

        usage = completion.usage
        prompt_tokens = usage.prompt_tokens if usage else 0
        completion_tokens = usage.completion_tokens if usage else 0
        text = completion.choices[0].message.content or ""

        track(
            day="day02",
            endpoint="/inference",
            provider=prov,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

        tokens_per_second = (
            (completion_tokens / (elapsed_ms / 1000.0)) if elapsed_ms > 0 else 0.0
        )

        runs.append(
            {
                "index": i + 1,
                "latency_ms": round(elapsed_ms, 1),
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "tokens_per_second": round(tokens_per_second, 1),
                "answer": text,
            }
        )

    avg_latency = round(sum(r["latency_ms"] for r in runs) / len(runs), 1)
    avg_tps = round(sum(r["tokens_per_second"] for r in runs) / len(runs), 1)

    return {
        "provider": prov,
        "model": model,
        "runs": runs,
        "avg_latency_ms": avg_latency,
        "avg_tokens_per_second": avg_tps,
    }
