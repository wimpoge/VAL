from typing import Optional

import psycopg2
from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel

from db import get_conn

router = APIRouter()


NODE_CATALOG: list[dict] = [
    # Day 1 — Intro + LLM Basics
    {"node_id": "N1", "day": 1, "label": "What is an AI engineer?"},
    {"node_id": "N2", "day": 1, "label": "Roles and responsibilities"},
    {"node_id": "N3", "day": 1, "label": "AI engineer learning path"},
    {"node_id": "N4", "day": 1, "label": "AI engineer vs ML engineer"},
    {"node_id": "N5", "day": 1, "label": "Common terminology"},
    # Day 2 — Core LLM Concepts
    {"node_id": "N6", "day": 2, "label": "Large language models"},
    {"node_id": "N7", "day": 2, "label": "Tokens"},
    {"node_id": "N8", "day": 2, "label": "Embeddings"},
    {"node_id": "N9", "day": 2, "label": "Inference"},
    {"node_id": "N10", "day": 2, "label": "Vector DBs (intro)"},
    # Day 3 — Prompt Engineering
    {"node_id": "N11", "day": 3, "label": "Prompt engineering basics"},
    {"node_id": "N12", "day": 3, "label": "Zero-shot vs few-shot"},
    {"node_id": "N13", "day": 3, "label": "Chain of thought"},
    {"node_id": "N14", "day": 3, "label": "Function calling"},
    {"node_id": "N15", "day": 3, "label": "Prompt caching"},
    # Day 4 — Prompt Engineering Advanced
    {"node_id": "N16", "day": 4, "label": "Structured output"},
    {"node_id": "N17", "day": 4, "label": "System prompting"},
    {"node_id": "N18", "day": 4, "label": "Role & behavior control"},
    {"node_id": "N19", "day": 4, "label": "ReAct"},
    {"node_id": "N20", "day": 4, "label": "Sampling / temperature"},
    # Day 5 — AI Models
    {"node_id": "N21", "day": 5, "label": "Pre-trained models"},
    {"node_id": "N22", "day": 5, "label": "Closed vs open source"},
    {"node_id": "N23", "day": 5, "label": "GPT-4o / Claude / Gemini"},
    {"node_id": "N24", "day": 5, "label": "Llama / Mistral / DeepSeek"},
    {"node_id": "N25", "day": 5, "label": "Fine-tuning"},
    # Day 6 — Embeddings
    {"node_id": "N26", "day": 6, "label": "What are embeddings?"},
    {"node_id": "N27", "day": 6, "label": "Semantic search"},
    {"node_id": "N28", "day": 6, "label": "Data classification"},
    {"node_id": "N29", "day": 6, "label": "Recommendation systems"},
    {"node_id": "N30", "day": 6, "label": "Anomaly detection"},
    # Day 7 — Vector Databases
    {"node_id": "N31", "day": 7, "label": "What are vector DBs?"},
    {"node_id": "N32", "day": 7, "label": "Embedding models"},
    {"node_id": "N33", "day": 7, "label": "pgvector / Pinecone / Weaviate"},
    {"node_id": "N34", "day": 7, "label": "Indexing embeddings"},
    {"node_id": "N35", "day": 7, "label": "Performing similarity search"},
    # Day 8 — RAG
    {"node_id": "N36", "day": 8, "label": "What is RAG?"},
    {"node_id": "N37", "day": 8, "label": "RAG vs fine-tuning"},
    {"node_id": "N38", "day": 8, "label": "Implementing RAG"},
    {"node_id": "N39", "day": 8, "label": "Retrieval process"},
    {"node_id": "N40", "day": 8, "label": "Generation step"},
    # Day 9 — AI Agents
    {"node_id": "N41", "day": 9, "label": "What are AI agents?"},
    {"node_id": "N42", "day": 9, "label": "Agentic use cases"},
    {"node_id": "N43", "day": 9, "label": "Tools & function calling"},
    {"node_id": "N44", "day": 9, "label": "Multi-agent systems"},
    {"node_id": "N45", "day": 9, "label": "Building AI agents"},
    # Day 10 — MCP + Safety + Multimodal
    {"node_id": "N46", "day": 10, "label": "Model context protocol (MCP)"},
    {"node_id": "N47", "day": 10, "label": "AI safety and ethics"},
    {"node_id": "N48", "day": 10, "label": "Multimodal AI"},
    {"node_id": "N49", "day": 10, "label": "OpenAI Vision / DALL-E"},
    {"node_id": "N50", "day": 10, "label": "Development tools"},
]

NODE_IDS = {n["node_id"] for n in NODE_CATALOG}


class ToggleRequest(BaseModel):
    completed: bool | None = None


def _fetch_completion_map() -> dict[str, dict]:
    with get_conn() as conn:
        if conn is None:
            return {}
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT node_id, completed, completed_at FROM node_progress"
                )
                return {
                    row[0]: {
                        "completed": bool(row[1]),
                        "completed_at": row[2].isoformat() if row[2] else None,
                    }
                    for row in cur.fetchall()
                }
        except psycopg2.Error:
            return {}


@router.get("/progress")
def list_progress():
    completion = _fetch_completion_map()
    nodes = []
    for n in NODE_CATALOG:
        rec = completion.get(n["node_id"], {"completed": False, "completed_at": None})
        nodes.append(
            {
                "node_id": n["node_id"],
                "day": n["day"],
                "label": n["label"],
                "completed": rec["completed"],
                "completed_at": rec["completed_at"],
            }
        )

    by_day: dict[int, dict[str, int]] = {}
    for n in nodes:
        bucket = by_day.setdefault(n["day"], {"total": 0, "done": 0})
        bucket["total"] += 1
        if n["completed"]:
            bucket["done"] += 1

    total_done = sum(1 for n in nodes if n["completed"])

    return {
        "nodes": nodes,
        "by_day": [
            {"day": d, "done": v["done"], "total": v["total"]}
            for d, v in sorted(by_day.items())
        ],
        "total_done": total_done,
        "total_nodes": len(nodes),
        "available": True,
    }


@router.post("/progress/{node_id}")
def toggle_node(
    node_id: str,
    body: Optional[ToggleRequest] = Body(default=None),
):
    node_id = node_id.upper()
    if node_id not in NODE_IDS:
        raise HTTPException(status_code=404, detail=f"Unknown node: {node_id}")

    catalog_entry = next(n for n in NODE_CATALOG if n["node_id"] == node_id)
    day = catalog_entry["day"]

    with get_conn() as conn:
        if conn is None:
            raise HTTPException(status_code=503, detail="Database unavailable")
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT completed FROM node_progress WHERE node_id = %s",
                    (node_id,),
                )
                row = cur.fetchone()
                current = bool(row[0]) if row else False

                if body is not None and body.completed is not None:
                    new_state = bool(body.completed)
                else:
                    new_state = not current

                cur.execute(
                    """
                    INSERT INTO node_progress (node_id, day, completed, completed_at)
                    VALUES (%s, %s, %s, CASE WHEN %s THEN NOW() ELSE NULL END)
                    ON CONFLICT (node_id) DO UPDATE
                      SET completed = EXCLUDED.completed,
                          completed_at = CASE WHEN EXCLUDED.completed THEN NOW() ELSE NULL END,
                          day = EXCLUDED.day
                    """,
                    (node_id, day, new_state, new_state),
                )
            conn.commit()
        except psycopg2.Error as e:
            try:
                conn.rollback()
            except psycopg2.Error:
                pass
            raise HTTPException(status_code=500, detail=f"DB error: {e}")

    return {"node_id": node_id, "day": day, "completed": new_state}
