import os

import numpy as np
import psycopg2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db import get_conn
from provider import get_embedding_client
from token_tracker import track

router = APIRouter()

_EMBED_MODEL = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def _embed_one(text: str) -> tuple[np.ndarray, int]:
    client = get_embedding_client()
    response = client.embeddings.create(model=_EMBED_MODEL, input=[text])
    vec = np.array(response.data[0].embedding, dtype=np.float32)
    total = response.usage.total_tokens if response.usage else 0
    return vec, total


def _vec_literal(vec: np.ndarray) -> str:
    return "[" + ",".join(f"{x:.6f}" for x in vec.tolist()) + "]"


def _track(endpoint: str, tokens: int) -> None:
    track(
        day="day07",
        endpoint=endpoint,
        provider="openai",
        model=_EMBED_MODEL,
        prompt_tokens=tokens,
        completion_tokens=0,
    )


def _db_unavailable() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail="Database unavailable. Start Postgres (start-all.ps1) and run init_db.py.",
    )


# ───────────────────────────────────────────────────────────────────
# POST /ingest — embed + upsert a document into pgvector
# ───────────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    id: str
    text: str


@router.post("/ingest")
def ingest(req: IngestRequest):
    doc_id = req.id.strip()
    if not doc_id:
        raise HTTPException(status_code=400, detail="id is required")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    vec, tokens = _embed_one(req.text)

    with get_conn() as conn:
        if conn is None:
            raise _db_unavailable()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO documents (id, text, embedding)
                    VALUES (%s, %s, %s::vector)
                    ON CONFLICT (id) DO UPDATE
                      SET text = EXCLUDED.text,
                          embedding = EXCLUDED.embedding
                    """,
                    (doc_id, req.text, _vec_literal(vec)),
                )
            conn.commit()
        except psycopg2.Error as e:
            try:
                conn.rollback()
            except psycopg2.Error:
                pass
            raise HTTPException(status_code=500, detail=f"DB error: {e}")

    _track("/ingest", tokens)

    return {
        "id": doc_id,
        "dimensions": int(len(vec)),
        "tokens_used": tokens,
        "provider": "openai",
        "model": _EMBED_MODEL,
    }


# ───────────────────────────────────────────────────────────────────
# POST /search — embed query, pgvector cosine search
# ───────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


@router.post("/search")
def search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query is required")
    top_k = max(1, min(req.top_k, 50))

    vec, tokens = _embed_one(req.query)
    emb_str = _vec_literal(vec)

    with get_conn() as conn:
        if conn is None:
            raise _db_unavailable()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id,
                           text,
                           1 - (embedding <=> %s::vector) AS score
                    FROM documents
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """,
                    (emb_str, emb_str, top_k),
                )
                rows = cur.fetchall()
        except psycopg2.Error as e:
            raise HTTPException(status_code=500, detail=f"DB error: {e}")

    results = [
        {"id": row[0], "text": row[1], "score": float(row[2])} for row in rows
    ]

    _track("/search", tokens)

    return {
        "query": req.query,
        "results": results,
        "tokens_used": tokens,
        "provider": "openai",
        "model": _EMBED_MODEL,
    }


# ───────────────────────────────────────────────────────────────────
# GET /documents — list stored docs
# ───────────────────────────────────────────────────────────────────

@router.get("/documents")
def list_documents():
    with get_conn() as conn:
        if conn is None:
            raise _db_unavailable()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, text, embedding IS NOT NULL AS has_embedding
                    FROM documents
                    ORDER BY id
                    """
                )
                rows = cur.fetchall()
        except psycopg2.Error as e:
            raise HTTPException(status_code=500, detail=f"DB error: {e}")

    return {
        "documents": [
            {"id": row[0], "text": row[1], "has_embedding": bool(row[2])}
            for row in rows
        ],
        "count": len(rows),
    }


# ───────────────────────────────────────────────────────────────────
# DELETE /documents/{id} — clean up a doc
# ───────────────────────────────────────────────────────────────────

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    with get_conn() as conn:
        if conn is None:
            raise _db_unavailable()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM documents WHERE id = %s", (doc_id,))
                deleted = cur.rowcount
            conn.commit()
        except psycopg2.Error as e:
            try:
                conn.rollback()
            except psycopg2.Error:
                pass
            raise HTTPException(status_code=500, detail=f"DB error: {e}")

    if deleted == 0:
        raise HTTPException(status_code=404, detail=f"Unknown document id: {doc_id}")

    return {"id": doc_id, "deleted": True}
