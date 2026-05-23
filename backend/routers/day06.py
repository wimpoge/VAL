import os

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from provider import get_embedding_client
from token_tracker import track

router = APIRouter()

_EMBED_MODEL = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def _embed(inputs: list[str]) -> tuple[list[np.ndarray], int]:
    client = get_embedding_client()
    response = client.embeddings.create(model=_EMBED_MODEL, input=inputs)
    vectors = [np.array(item.embedding, dtype=np.float32) for item in response.data]
    total = response.usage.total_tokens if response.usage else 0
    return vectors, total


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0.0:
        return 0.0
    return float(np.dot(a, b) / denom)


def _track(endpoint: str, tokens: int) -> None:
    track(
        day="day06",
        endpoint=endpoint,
        provider="openai",
        model=_EMBED_MODEL,
        prompt_tokens=tokens,
        completion_tokens=0,
    )


# ───────────────────────────────────────────────────────────────────
# N26 — What are embeddings? (single-text inspector)
# ───────────────────────────────────────────────────────────────────

class EmbedRequest(BaseModel):
    text: str


@router.post("/embed")
def embed(req: EmbedRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    vectors, tokens = _embed([req.text])
    vec = vectors[0]
    _track("/embed", tokens)

    return {
        "embedding": vec.tolist(),
        "dimensions": int(len(vec)),
        "tokens_used": tokens,
        "provider": "openai",
        "model": _EMBED_MODEL,
    }


# ───────────────────────────────────────────────────────────────────
# N27 — Semantic search
# ───────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    documents: list[str]
    top_k: int = 3


@router.post("/search")
def search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query is required")
    docs = [d for d in (s.strip() for s in req.documents) if d]
    if not docs:
        raise HTTPException(status_code=400, detail="documents is required")

    vectors, tokens = _embed([req.query, *docs])
    q = vectors[0]
    scored = [
        {"document": docs[i], "score": _cosine(q, vectors[i + 1])}
        for i in range(len(docs))
    ]
    scored.sort(key=lambda r: r["score"], reverse=True)
    _track("/search", tokens)

    top_k = max(1, min(req.top_k, len(scored)))

    return {
        "query": req.query,
        "results": scored[:top_k],
        "all_results": scored,
        "tokens_used": tokens,
        "provider": "openai",
        "model": _EMBED_MODEL,
    }


# ───────────────────────────────────────────────────────────────────
# N28 — Data classification (zero-shot via embeddings)
# ───────────────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    text: str
    labels: list[str]


@router.post("/classify")
def classify(req: ClassifyRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    labels = [l for l in (s.strip() for s in req.labels) if l]
    if len(labels) < 2:
        raise HTTPException(
            status_code=400, detail="provide at least 2 labels"
        )

    vectors, tokens = _embed([req.text, *labels])
    text_vec = vectors[0]
    scored = [
        {"label": labels[i], "score": _cosine(text_vec, vectors[i + 1])}
        for i in range(len(labels))
    ]
    scored.sort(key=lambda r: r["score"], reverse=True)
    _track("/classify", tokens)

    return {
        "text": req.text,
        "scores": scored,
        "top_label": scored[0]["label"],
        "top_score": scored[0]["score"],
        "tokens_used": tokens,
        "provider": "openai",
        "model": _EMBED_MODEL,
    }


# ───────────────────────────────────────────────────────────────────
# N29 — Recommendation system (content-based, nearest neighbours)
# ───────────────────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    seed_index: int
    items: list[str]
    top_k: int = 3


@router.post("/recommend")
def recommend(req: RecommendRequest):
    items = [i.strip() for i in req.items]
    if any(not i for i in items):
        raise HTTPException(status_code=400, detail="all items must be non-empty")
    if len(items) < 2:
        raise HTTPException(status_code=400, detail="provide at least 2 items")
    if not (0 <= req.seed_index < len(items)):
        raise HTTPException(status_code=400, detail="seed_index out of range")

    vectors, tokens = _embed(items)
    seed = vectors[req.seed_index]
    candidates = [
        {
            "index": i,
            "item": items[i],
            "score": _cosine(seed, vectors[i]),
        }
        for i in range(len(items))
        if i != req.seed_index
    ]
    candidates.sort(key=lambda r: r["score"], reverse=True)
    _track("/recommend", tokens)

    top_k = max(1, min(req.top_k, len(candidates)))

    return {
        "seed_index": req.seed_index,
        "seed_item": items[req.seed_index],
        "recommendations": candidates[:top_k],
        "all_candidates": candidates,
        "tokens_used": tokens,
        "provider": "openai",
        "model": _EMBED_MODEL,
    }


# ───────────────────────────────────────────────────────────────────
# N30 — Anomaly detection (distance to centroid)
# ───────────────────────────────────────────────────────────────────

class AnomalyRequest(BaseModel):
    items: list[str]


@router.post("/anomaly")
def anomaly(req: AnomalyRequest):
    items = [i.strip() for i in req.items]
    if any(not i for i in items):
        raise HTTPException(status_code=400, detail="all items must be non-empty")
    if len(items) < 3:
        raise HTTPException(
            status_code=400, detail="provide at least 3 items for anomaly detection"
        )

    vectors, tokens = _embed(items)
    stack = np.vstack(vectors)
    centroid = stack.mean(axis=0)

    distances = [1.0 - _cosine(centroid, v) for v in vectors]
    arr = np.array(distances, dtype=np.float32)
    mean_d = float(arr.mean())
    std_d = float(arr.std()) if len(arr) > 1 else 0.0
    threshold = mean_d + 1.5 * std_d if std_d > 0 else mean_d

    scored = [
        {
            "index": i,
            "item": items[i],
            "distance": float(distances[i]),
            "is_anomaly": bool(distances[i] >= threshold and std_d > 0),
        }
        for i in range(len(items))
    ]
    scored.sort(key=lambda r: r["distance"], reverse=True)
    _track("/anomaly", tokens)

    return {
        "results": scored,
        "centroid_dimensions": int(stack.shape[1]),
        "threshold": threshold,
        "mean_distance": mean_d,
        "std_distance": std_d,
        "tokens_used": tokens,
        "provider": "openai",
        "model": _EMBED_MODEL,
    }
