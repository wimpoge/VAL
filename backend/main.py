from pathlib import Path

from dotenv import load_dotenv

# Load .env from the project root (one level above backend/)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
# Fallback to default search if the project-root .env doesn't exist
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from provider import provider_router
from token_tracker import tracker_router
from routers import (
    day01,
    day02,
    day03,
    day04,
    day05,
    day06,
    day07,
    day08,
    day09,
    day10,
    day11,
    day12,
    day13,
    day14,
    day15,
    day16,
    day17,
    day18,
    day19,
    day20,
    progress,
)

DAY_TOPICS = {
    1: "Intro + LLM Basics",
    2: "Core LLM Concepts",
    3: "Prompt Engineering",
    4: "Prompt Engineering Advanced",
    5: "AI Models",
    6: "Embeddings",
    7: "Vector Databases",
    8: "RAG",
    9: "AI Agents",
    10: "MCP + Safety + Multimodal",
    11: "Vector DB Landscape",
    12: "ML Frameworks",
    13: "Cloud AI Platforms",
    14: "Local Model Inference",
    15: "Observability & Evals",
    16: "LLM Frameworks",
    17: "Production & Deployment",
    18: "Advanced AI Topics",
    19: "AI Business & Products",
    20: "Capstone — Build Your AI App",
}

tags_metadata = [
    {"name": "System", "description": "Health and root endpoints."},
    {"name": "Providers", "description": "List available providers and their models."},
    {
        "name": "Tracking",
        "description": "Token usage — current totals, history (daily/monthly), and reset.",
    },
    {
        "name": "Progress",
        "description": "Per-node completion checkmarks across all 50 nodes.",
    },
    *[
        {"name": f"Day {n:02d} — {topic}", "description": f"Endpoints for Day {n}."}
        for n, topic in DAY_TOPICS.items()
    ],
]

app = FastAPI(
    title="VAL — Visual AI Learning",
    version="0.1.0",
    openapi_tags=tags_metadata,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(provider_router, tags=["Providers"])
app.include_router(tracker_router, tags=["Tracking"])
app.include_router(progress.router, tags=["Progress"])

_day_routers = [
    day01, day02, day03, day04, day05,
    day06, day07, day08, day09, day10,
    day11, day12, day13, day14, day15, day16, day17, day18, day19, day20,
]
for n, mod in enumerate(_day_routers, start=1):
    tag = f"Day {n:02d} — {DAY_TOPICS[n]}"
    app.include_router(mod.router, prefix=f"/day{n:02d}", tags=[tag])


@app.get("/", tags=["System"])
def root():
    return {"status": "ok", "service": "ai-engineer-roadmap"}
