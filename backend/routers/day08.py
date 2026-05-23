import os
import time

import numpy as np
import psycopg2
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from db import get_conn
from provider import get_client, get_embedding_client, get_model, get_provider
from token_tracker import track

router = APIRouter()

_EMBED_MODEL = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
_CHUNK_SIZE = 500
_CHUNK_OVERLAP = 50
_MAX_UPLOAD_BYTES = 256 * 1024
_DEFAULT_TOP_K = 5

_RAG_SYSTEM = (
    "You are a helpful assistant answering questions about the user's "
    "documents. Use ONLY the context below to answer. If the context does "
    "not contain the answer, reply exactly: \"I don't have that in the "
    "provided documents.\" Keep the answer concise and in the same language "
    "as the question. No markdown headers, no preamble.\n\n"
    "Context:\n{context}"
)


def _chunk(text: str, size: int = _CHUNK_SIZE, overlap: int = _CHUNK_OVERLAP) -> list[str]:
    if not text.strip():
        return []
    step = max(1, size - overlap)
    out: list[str] = []
    i = 0
    while i < len(text):
        piece = text[i : i + size].strip()
        if piece:
            out.append(piece)
        i += step
    return out


def _embed_batch(inputs: list[str]) -> tuple[list[np.ndarray], int]:
    client = get_embedding_client()
    response = client.embeddings.create(model=_EMBED_MODEL, input=inputs)
    vectors = [np.array(item.embedding, dtype=np.float32) for item in response.data]
    total = response.usage.total_tokens if response.usage else 0
    return vectors, total


def _vec_literal(vec: np.ndarray) -> str:
    return "[" + ",".join(f"{x:.6f}" for x in vec.tolist()) + "]"


def _track_embed(endpoint: str, tokens: int) -> None:
    track(
        day="day08",
        endpoint=endpoint,
        provider="openai",
        model=_EMBED_MODEL,
        prompt_tokens=tokens,
        completion_tokens=0,
    )


def _track_gen(endpoint: str, prov: str, model: str, pt: int, ct: int) -> None:
    track(
        day="day08",
        endpoint=endpoint,
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )


def _db_unavailable() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail="Database unavailable. Start Postgres (start-all.ps1) and run init_db.py.",
    )


def _insert_chunks(
    source: str, chunks: list[str], vectors: list[np.ndarray]
) -> int:
    with get_conn() as conn:
        if conn is None:
            raise _db_unavailable()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM rag_chunks WHERE source = %s", (source,)
                )
                rows = [
                    (source, i, chunks[i], _vec_literal(vectors[i]))
                    for i in range(len(chunks))
                ]
                cur.executemany(
                    """
                    INSERT INTO rag_chunks (source, chunk_index, text, embedding)
                    VALUES (%s, %s, %s, %s::vector)
                    """,
                    rows,
                )
            conn.commit()
            return len(rows)
        except psycopg2.Error as e:
            try:
                conn.rollback()
            except psycopg2.Error:
                pass
            raise HTTPException(status_code=500, detail=f"DB error: {e}")


def _retrieve(query_vec: np.ndarray, top_k: int) -> list[dict]:
    emb_str = _vec_literal(query_vec)
    with get_conn() as conn:
        if conn is None:
            raise _db_unavailable()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id,
                           source,
                           chunk_index,
                           text,
                           1 - (embedding <=> %s::vector) AS score
                    FROM rag_chunks
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """,
                    (emb_str, emb_str, top_k),
                )
                rows = cur.fetchall()
        except psycopg2.Error as e:
            raise HTTPException(status_code=500, detail=f"DB error: {e}")

    return [
        {
            "id": int(row[0]),
            "source": row[1],
            "chunk_index": int(row[2]),
            "text": row[3],
            "score": float(row[4]),
        }
        for row in rows
    ]


# ───────────────────────────────────────────────────────────────────
# POST /upload — multipart .txt → chunk + embed + insert
# ───────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    raw = await file.read()
    if len(raw) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"file too large: max {_MAX_UPLOAD_BYTES} bytes",
        )
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400, detail="file must be UTF-8 plain text"
        )

    chunks = _chunk(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="no usable text found")

    vectors, tokens = _embed_batch(chunks)
    _track_embed("/upload", tokens)

    source = file.filename or "uploaded.txt"
    chunks_stored = _insert_chunks(source, chunks, vectors)

    return {
        "source": source,
        "chunks_stored": chunks_stored,
        "tokens_used": tokens,
        "chunk_size": _CHUNK_SIZE,
        "chunk_overlap": _CHUNK_OVERLAP,
        "embed_provider": "openai",
        "embed_model": _EMBED_MODEL,
        "preview": chunks[: min(3, len(chunks))],
    }


# ───────────────────────────────────────────────────────────────────
# POST /upload-text — paste text (no multipart needed)
# ───────────────────────────────────────────────────────────────────

class UploadTextRequest(BaseModel):
    source: str
    text: str


@router.post("/upload-text")
def upload_text(req: UploadTextRequest):
    source = req.source.strip()
    if not source:
        raise HTTPException(status_code=400, detail="source is required")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    if len(req.text.encode("utf-8")) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"text too large: max {_MAX_UPLOAD_BYTES} bytes",
        )

    chunks = _chunk(req.text)
    if not chunks:
        raise HTTPException(status_code=400, detail="no usable text found")

    vectors, tokens = _embed_batch(chunks)
    _track_embed("/upload-text", tokens)
    chunks_stored = _insert_chunks(source, chunks, vectors)

    return {
        "source": source,
        "chunks_stored": chunks_stored,
        "tokens_used": tokens,
        "chunk_size": _CHUNK_SIZE,
        "chunk_overlap": _CHUNK_OVERLAP,
        "embed_provider": "openai",
        "embed_model": _EMBED_MODEL,
        "preview": chunks[: min(3, len(chunks))],
    }


# ───────────────────────────────────────────────────────────────────
# POST /retrieve — embed query, return top-k chunks (no LLM)
# ───────────────────────────────────────────────────────────────────

class RetrieveRequest(BaseModel):
    question: str
    top_k: int = _DEFAULT_TOP_K


@router.post("/retrieve")
def retrieve(req: RetrieveRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")
    top_k = max(1, min(req.top_k, 20))

    vectors, tokens = _embed_batch([req.question])
    _track_embed("/retrieve", tokens)
    results = _retrieve(vectors[0], top_k)

    return {
        "question": req.question,
        "results": results,
        "embed_tokens": tokens,
        "embed_provider": "openai",
        "embed_model": _EMBED_MODEL,
    }


# ───────────────────────────────────────────────────────────────────
# POST /ask — RAG: retrieve + generate (single-language per policy)
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None
    top_k: int = _DEFAULT_TOP_K


def _format_context(chunks: list[dict]) -> str:
    if not chunks:
        return "(no documents indexed yet)"
    return "\n\n".join(
        f"[{i + 1}] {c['text']}" for i, c in enumerate(chunks)
    )


@router.post("/ask")
def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")
    top_k = max(1, min(req.top_k, 20))

    vectors, embed_tokens = _embed_batch([req.question])
    _track_embed("/ask", embed_tokens)
    sources = _retrieve(vectors[0], top_k)

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    system = _RAG_SYSTEM.format(context=_format_context(sources))

    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": req.question},
            ],
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"{prov} call failed: {type(e).__name__}: {e}",
        )
    latency_ms = int((time.perf_counter() - t0) * 1000)

    usage = completion.usage
    gen_pt = usage.prompt_tokens if usage else 0
    gen_ct = usage.completion_tokens if usage else 0
    _track_gen("/ask", prov, model, gen_pt, gen_ct)

    return {
        "question": req.question,
        "answer": completion.choices[0].message.content or "",
        "sources": sources,
        "embed_tokens": embed_tokens,
        "gen_tokens": gen_pt + gen_ct,
        "gen_prompt_tokens": gen_pt,
        "gen_completion_tokens": gen_ct,
        "gen_provider": prov,
        "gen_model": model,
        "latency_ms": latency_ms,
    }


# ───────────────────────────────────────────────────────────────────
# POST /compare — same question with RAG vs without RAG
# ───────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    question: str
    provider: str | None = None
    top_k: int = _DEFAULT_TOP_K


_PLAIN_SYSTEM = (
    "You are a helpful assistant. Answer the user's question from your own "
    "knowledge. Keep the answer concise and in the same language as the "
    "question. No markdown headers, no preamble."
)


@router.post("/compare")
def compare(req: CompareRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")
    top_k = max(1, min(req.top_k, 20))

    vectors, embed_tokens = _embed_batch([req.question])
    _track_embed("/compare", embed_tokens)
    sources = _retrieve(vectors[0], top_k)

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    def _call(system: str) -> tuple[str, int, int, int]:
        t0 = time.perf_counter()
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": req.question},
                ],
            )
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"{prov} call failed: {type(e).__name__}: {e}",
            )
        latency_ms = int((time.perf_counter() - t0) * 1000)
        usage = completion.usage
        pt = usage.prompt_tokens if usage else 0
        ct = usage.completion_tokens if usage else 0
        return (
            completion.choices[0].message.content or "",
            pt,
            ct,
            latency_ms,
        )

    plain_answer, p_pt, p_ct, p_lat = _call(_PLAIN_SYSTEM)
    _track_gen("/compare", prov, model, p_pt, p_ct)

    rag_answer, r_pt, r_ct, r_lat = _call(
        _RAG_SYSTEM.format(context=_format_context(sources))
    )
    _track_gen("/compare", prov, model, r_pt, r_ct)

    return {
        "question": req.question,
        "plain": {
            "answer": plain_answer,
            "prompt_tokens": p_pt,
            "completion_tokens": p_ct,
            "latency_ms": p_lat,
        },
        "rag": {
            "answer": rag_answer,
            "prompt_tokens": r_pt,
            "completion_tokens": r_ct,
            "latency_ms": r_lat,
            "sources": sources,
        },
        "embed_tokens": embed_tokens,
        "gen_provider": prov,
        "gen_model": model,
    }


# ───────────────────────────────────────────────────────────────────
# GET /sources — list ingested sources with chunk counts
# DELETE /sources/{source} — drop all chunks for one source
# ───────────────────────────────────────────────────────────────────

@router.get("/sources")
def list_sources():
    with get_conn() as conn:
        if conn is None:
            raise _db_unavailable()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT source,
                           COUNT(*) AS chunks,
                           MAX(chunk_index) AS last_index
                    FROM rag_chunks
                    GROUP BY source
                    ORDER BY source
                    """
                )
                rows = cur.fetchall()
        except psycopg2.Error as e:
            raise HTTPException(status_code=500, detail=f"DB error: {e}")

    return {
        "sources": [
            {
                "source": row[0],
                "chunks": int(row[1]),
                "last_index": int(row[2]) if row[2] is not None else 0,
            }
            for row in rows
        ],
        "count": len(rows),
    }


@router.delete("/sources/{source}")
def delete_source(source: str):
    with get_conn() as conn:
        if conn is None:
            raise _db_unavailable()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM rag_chunks WHERE source = %s", (source,))
                deleted = cur.rowcount
            conn.commit()
        except psycopg2.Error as e:
            try:
                conn.rollback()
            except psycopg2.Error:
                pass
            raise HTTPException(status_code=500, detail=f"DB error: {e}")

    if deleted == 0:
        raise HTTPException(status_code=404, detail=f"Unknown source: {source}")

    return {"source": source, "deleted_chunks": int(deleted)}
