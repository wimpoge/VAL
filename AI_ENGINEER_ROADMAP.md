# VAL — Visual AI Learning
> 10 days · 5 nodes/day · Stack: **Next.js + Python (FastAPI)** · Per-request model switcher · Bilingual (EN + ID)

> 📝 Implementation history lives in [`CHANGELOG.md`](./CHANGELOG.md). This file is the curriculum spec; the changelog is the build log.

---

## Why this project exists

This roadmap is for people who want to **become an AI engineer but have never written an LLM line of code before** — the absolute beginner. It is *not* a reference manual. It is a guided tour where every abstract concept has a button you can click and watch happen.

**The promise:**
- **Visual first.** Every node tries to make the invisible visible. Embeddings become coloured heatmaps and dots on a similarity circle. Tokens become pastel chips. Inference becomes a six-step animated pipeline. Vector search becomes a documents → vector DB → query → result flow with green-highlighted matches. If you can see it move, you can understand it.
- **"Baby explained" tone.** The shared system prompt (`BEGINNER_SYSTEM_PROMPT`) tells the model to teach "like to a curious 10-year-old": one-sentence plain answer first, then a real-life analogy, then a concrete mini-example, define every jargon term inline in parentheses, max two sentences per paragraph, never assume prior knowledge. No "as you know" — because you don't yet, and that is fine.
- **Hands-on, not read-only.** Every day is a working FastAPI endpoint plus a Next.js page. You type a question, you watch a real OpenAI / Groq / DeepSeek / Gemini response stream in. You change the provider mid-session and feel the latency difference. You upload a `.txt` file and see RAG retrieve from it. The point is not to memorise — the point is to *play* until it clicks.
- **50 nodes, end-to-end.** Day 1 starts at "what is an AI engineer?" Day 10 ends at multimodal apps with vision + image generation. In between: tokens, embeddings, prompt engineering, function calling, fine-tuning, vector DBs, RAG, agents, MCP, safety. Each node is a small, completable thing — the dopamine of a green `✓` is part of the design.

If you finish this and the words "RAG", "embedding", "agent loop", and "function calling" feel like things you have *built*, not things you have *read about* — the roadmap did its job.

---

## Cost model reference

| Provider | Model | Input | Output | Notes |
|---|---|---|---|---|
| OpenAI | `gpt-4o-mini` | $0.15/1M | $0.60/1M | Default, most compatible |
| OpenAI | `text-embedding-3-small` | $0.02/1M | — | Embeddings only |
| OpenAI | `dall-e-2` | flat $0.0018/img | — | Image gen |
| **Groq** | `llama-3.1-8b-instant` | **$0.05/1M** | **$0.08/1M** | Cheapest, blazing fast |
| **DeepSeek** | `deepseek-chat` | **$0.27/1M** | **$1.10/1M** | Near-frontier quality |
| **Gemini** | `gemini-2.5-flash-lite` | **$0.10/1M** | **$0.40/1M** | Google, OpenAI-compatible |

All three alternatives use the **OpenAI-compatible API** — same Python SDK, just swap `base_url` and `api_key`. Every AI endpoint accepts a `provider` field in the request body, so you can switch mid-session without touching `.env` or restarting.

---

## Project structure

```
ai-engineer-roadmap/
├── .env
├── backend/
│   ├── main.py              ← FastAPI entry point
│   ├── provider.py          ← runtime-switchable client factory
│   ├── token_tracker.py     ← per-provider token + cost tracker
│   ├── requirements.txt
│   ├── routers/
│   │   ├── day01.py … day10.py
│   └── init_db.py
└── frontend/
    └── app/
        ├── layout.tsx        ← navbar + token counter (per-provider breakdown)
        ├── components/
        │   └── ModelSwitcher.tsx  ← shared dropdown used on every page
        ├── page.tsx
        ├── day-01/page.tsx … day-10/page.tsx
        └── advanced-ai/page.tsx
```

---

## How to use with Claude Code

Each day: **Backend first, then Frontend**.

```bash
# Backend
cd ai-engineer-roadmap/backend
pip install -r requirements.txt
python init_db.py
uvicorn main:app --reload --port 8000

# Frontend (once)
cd ai-engineer-roadmap/frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm run dev
```

---

## `.env`

```env
# ── OpenAI ─────────────────────────────────────────────────
OPENAI_API_KEY=sk-...

# ── Groq  ($0.05 input / $0.08 output per 1M) ──────────────
# Sign up free: https://console.groq.com
GROQ_API_KEY=gsk_...

# ── DeepSeek  ($0.27 input / $1.10 output per 1M) ──────────
# Sign up: https://platform.deepseek.com
DEEPSEEK_API_KEY=sk-...

# ── Gemini  ($0.10 input / $0.40 output per 1M) ────────────
# Sign up free: https://aistudio.google.com
GEMINI_API_KEY=AIza...

# ── Default provider (fallback when no provider in request) ─
# Options: openai | groq | deepseek | gemini
DEFAULT_PROVIDER=openai

# ── Model names per provider ────────────────────────────────
OPENAI_CHAT_MODEL=gpt-4o-mini
GROQ_CHAT_MODEL=llama-3.1-8b-instant
DEEPSEEK_CHAT_MODEL=deepseek-chat
GEMINI_CHAT_MODEL=gemini-2.5-flash-lite
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# ── Database ────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/ai_roadmap
```

---

## `backend/requirements.txt`

```
fastapi==0.115.5
uvicorn==0.32.1
openai==1.54.0
numpy==2.1.3
psycopg2-binary==2.9.10
python-multipart==0.0.12
httpx==0.27.2
python-dotenv==1.0.1
```

---

## Step 0 — Scaffold (run once before Day 1)

### Backend scaffold prompt
```
Set up a FastAPI project at backend/

━━━ backend/provider.py ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Runtime-switchable provider factory. No global state — takes provider name as argument.

PROVIDER_CONFIG dict (built from os.environ):
  {
    "openai":   {"base_url": None,     "api_key": OPENAI_API_KEY,   "model": OPENAI_CHAT_MODEL},
    "groq":     {"base_url": "https://api.groq.com/openai/v1",
                 "api_key": GROQ_API_KEY,    "model": GROQ_CHAT_MODEL},
    "deepseek": {"base_url": "https://api.deepseek.com",
                 "api_key": DEEPSEEK_API_KEY, "model": DEEPSEEK_CHAT_MODEL},
    "gemini":   {"base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
                 "api_key": GEMINI_API_KEY,  "model": GEMINI_CHAT_MODEL},
  }

Function get_client(provider: str | None = None) -> openai.OpenAI:
  - If provider is None, use os.environ["DEFAULT_PROVIDER"]
  - Looks up PROVIDER_CONFIG[provider]
  - Returns openai.OpenAI(base_url=..., api_key=...)

Function get_model(provider: str | None = None) -> str:
  - Returns PROVIDER_CONFIG[provider or DEFAULT_PROVIDER]["model"]

Function get_provider(provider: str | None = None) -> str:
  - Returns the resolved provider string

Function get_embedding_client() -> openai.OpenAI:
  - Always returns openai.OpenAI(api_key=OPENAI_API_KEY) for embeddings

AVAILABLE_PROVIDERS list: ["openai", "groq", "deepseek", "gemini"]

GET /providers endpoint (on main router, no prefix):
  - Returns {"providers": AVAILABLE_PROVIDERS, "default": DEFAULT_PROVIDER,
             "models": {provider: model_name, ...}}
  - Frontend calls this on load to build the switcher dropdown

━━━ backend/token_tracker.py ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Global in-memory tracker. All costs in USD per 1M tokens.

RATES dict:
  {
    "openai":    {"gpt-4o-mini":             {"input": 0.15, "output": 0.60},
                  "text-embedding-3-small":  {"input": 0.02, "output": 0.0},
                  "dall-e-2":                {"flat": 0.0018}},
    "groq":      {"llama-3.1-8b-instant":    {"input": 0.05, "output": 0.08}},
    "deepseek":  {"deepseek-chat":           {"input": 0.27, "output": 1.10}},
    "gemini":    {"gemini-2.5-flash-lite":   {"input": 0.10, "output": 0.40}},
  }

Module-level _totals dict:
  {
    "total_tokens": 0,
    "total_cost_usd": 0.0,
    "call_count": 0,
    "by_provider": {
      "openai":   {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost_usd": 0.0, "calls": 0},
      "groq":     {...},
      "deepseek": {...},
      "gemini":   {...},
    },
    "calls": []   ← last 100 individual call records
  }

Function track(day: str, endpoint: str, provider: str, model: str,
               prompt_tokens: int, completion_tokens: int):
  - Calculates cost for this call using RATES
  - For "dall-e-2": cost = flat rate (prompt_tokens=1 signals 1 image)
  - Otherwise: cost = (prompt_tokens/1_000_000 * input_rate) + (completion_tokens/1_000_000 * output_rate)
  - Updates _totals.total_tokens, total_cost_usd, call_count
  - Updates _totals.by_provider[provider] fields
  - Appends to calls (keep last 100):
      {"day", "endpoint", "provider", "model", "prompt_tokens", "completion_tokens",
       "cost_usd": float, "timestamp": ISO string}

Function get_summary() -> dict: returns copy of _totals

FastAPI router tracker_router:
  GET /tokens
    Returns get_summary()

  DELETE /tokens/reset
    Resets _totals to zeros, clears calls list
    Returns {"message": "reset ok"}

━━━ backend/main.py ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- FastAPI app
- Load .env with python-dotenv
- CORS for http://localhost:3000
- Include tracker_router (no prefix)
- GET /providers → return providers info (from provider.py AVAILABLE_PROVIDERS + models)
- Mount routers: /day01…/day10

━━━ backend/init_db.py ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Connect to DATABASE_URL
- CREATE EXTENSION IF NOT EXISTS vector;
- CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, text TEXT NOT NULL, embedding vector(1536));
- CREATE TABLE IF NOT EXISTS rag_chunks (id SERIAL PRIMARY KEY, source TEXT, chunk_index INT, text TEXT NOT NULL, embedding vector(1536));
- Print "DB initialized"

Create all 10 empty stub router files in routers/.
Requirements: No placeholder comments — real implementation only
```

### Frontend scaffold prompt
```
Set up a Next.js 14 App Router project at frontend/

━━━ frontend/app/components/ModelSwitcher.tsx ━━━━━━━━━━━━━━
Reusable client component. Used on every day page.

Props:
  selected: string          ← current provider
  onChange: (p: string) => void
  disabled?: boolean        ← true while a request is loading

On mount: fetch GET http://localhost:8000/providers
  Response: {providers: string[], default: string, models: {[p]: model_name}}

Renders a styled dropdown (<select>):
  - Options: "openai (gpt-4o-mini)", "groq (llama-3.1-8b-instant)", etc.
  - Uses model name from the /providers response for each label
  - Tailwind: compact, fits inline next to form inputs
  - When disabled: muted opacity

━━━ frontend/app/layout.tsx ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mark as 'use client'. Sticky top navbar, bg-gray-900, text-white, h-12.

Left side:
- "AI Engineer" bold label
- Day 1–10 links (href="/day-01" … "/day-10"), active highlighted

Right side:
- "Advanced AI" tab (href="/advanced-ai"), indigo/purple tint
- Token counter widget:
    Fetch GET http://localhost:8000/tokens on mount + every 30s
    Show total: "2,840 tokens · $0.0004"
    On click → expand a dropdown panel below the navbar showing per-provider breakdown:
      Each row: provider badge | tokens | cost
      e.g.  [openai]  1,200 tokens  $0.0002
            [groq]    1,640 tokens  $0.0001
            [deepseek]    0 tokens  $0.0000
            [gemini]      0 tokens  $0.0000
    "×" reset button: calls DELETE /tokens/reset then refetches
    If fetch fails, show nothing

━━━ frontend/app/page.tsx ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Redirect to /day-01

━━━ frontend/app/advanced-ai/page.tsx ━━━━━━━━━━━━━━━━━━━━━━
"Coming soon" — centered, title "Advanced AI", subtitle muted.

Create stub pages day-01 through day-10 (h1 title only).

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Global rules (applies to ALL day pages)

### Backend: per-request provider override

Every AI endpoint body includes an **optional** `provider` field:

```python
class AskRequest(BaseModel):
    question: str
    provider: str | None = None   # if None, uses DEFAULT_PROVIDER from .env

# Usage in every endpoint:
client = get_client(req.provider)
model  = get_model(req.provider)
prov   = get_provider(req.provider)
```

This means the frontend can send `{"question": "...", "provider": "groq"}` to use Groq for that specific call — no restart needed.

### Backend: bilingual response

Every chat endpoint uses this system prompt pattern (defined once as
`BEGINNER_SYSTEM_PROMPT` in `backend/provider.py` and reused):
```
"You are a friendly AI engineering tutor teaching complete beginners.
 This app is specifically about AI engineering and LLMs.
 When the user mentions RAG, it always means Retrieval-Augmented Generation
 (not Red Amber Green). When the user mentions tokens, it means LLM tokens
 (not authentication tokens). When the user mentions models, it means
 AI/ML models (not fashion models or 3D models).
 Always interpret questions in the context of AI engineering.

 Explain everything like you would to a curious 10-year-old.

 Rules:
 1. Always start with a one-sentence plain answer before any explanation.
 2. Use a real-life analogy or story to explain every concept.
 3. Follow the analogy with a concrete mini-example using everyday objects or situations.
 4. Define every technical term the moment you use it, in parentheses, in one simple phrase.
 5. Keep sentences short. Max 2 sentences per paragraph.
 6. Never assume prior knowledge.

 Additionally, for topics that are naturally step-by-step or flow-based, include a
 'diagram' field with a steps array and connections array so the UI can render a
 visual flow diagram. Only include diagram for topics where a flow genuinely helps
 understanding (e.g. RAG pipeline, agent loop, function calling, multi-agent flow,
 vector DB query). For conceptual or definition topics, set diagram to null.

 Reply only as JSON:
 {
   'answer': '...',
   'diagram': null | { 'title': '...', 'steps': [{'id': N, 'label': '...', 'sublabel': '...'}], 'connections': [[N,N],...] }
 }
 No markdown. No extra keys."
```
Use `response_format={"type": "json_object"}` on every chat call.

Diagram contract: `diagram` is `null` for conceptual topics, or an object with
`title`, a `steps` array of `{id, label, sublabel?}`, and a `connections` array of
`[fromId, toId]` pairs. The frontend renders it via `<FlowDiagram>` below the answer.

For the bilingual `/ask` endpoint the JSON keys are `answer_en`, `answer_id`, and
`diagram` (same shape). For streaming endpoints the `answer` streams as plain text
and the diagram is produced by a separate non-streaming call (via
`provider.generate_diagram`), emitted to the SSE stream as `event: diagram` just
before `event: done`.

### Frontend: ModelSwitcher on every page

Every day page has a `<ModelSwitcher>` above the input. The selected provider is local state per page — it gets passed as `provider` in the fetch body. No global state needed.

Response always shows:
- Two answer cards: 🇬🇧 EN | 🇮🇩 ID
- Footer: `provider · model · X prompt + Y completion tokens · $0.0001`

> Implementation history (the dated "Update — …" entries that used to live here) has moved to [`CHANGELOG.md`](./CHANGELOG.md). The bilingual JSON shape and a few other details in the day-by-day prompts below are frozen as the **original spec** — the actual codebase has moved on (most notably to single-language streamed responses, per the 2026-05-11 changelog entry).

---

## Day 1 — Intro + LLM Basics

**Goal:** Understand what AI engineering is and how LLMs work at a high level.

### Nodes
- [ ] **N1** — What is an AI engineer?
- [ ] **N2** — Roles and responsibilities
- [ ] **N3** — AI engineer learning path
- [ ] **N4** — AI engineer vs ML engineer
- [ ] **N5** — Common terminology (AI, AGI, LLMs, inference, tokens)

### Backend prompt — `backend/routers/day01.py`
```
I'm learning AI engineering. Today is Day 1.

Fill in backend/routers/day01.py:

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

POST /ask
- Accepts AskRequest
- client = get_client(req.provider), model = get_model(req.provider), prov = get_provider(req.provider)
- System: "You are a helpful AI engineering tutor. Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}
- call track(day="day01", endpoint="/ask", provider=prov, model=model,
             prompt_tokens=usage.prompt_tokens, completion_tokens=usage.completion_tokens)
- Returns:
  {"answer_en": "...", "answer_id": "...",
   "prompt_tokens": N, "completion_tokens": N, "provider": prov, "model": model}

Requirements: from provider import get_client, get_model, get_provider
              from token_tracker import track
              No placeholder comments
```

### Frontend prompt — `frontend/app/day-01/page.tsx`
```
I'm learning AI engineering. Today is Day 1.

Replace frontend/app/day-01/page.tsx:

State: question (string), provider (string, default "openai"), result (null | response), loading (bool)

Layout:
- <ModelSwitcher selected={provider} onChange={setProvider} disabled={loading} />
- Text input for question
- Submit button → POST http://localhost:8000/day01/ask
    body: {question, provider}
- While loading: spinner
- After response:
    Two cards side by side:
      Left  — "🇬🇧 English"  : answer_en
      Right — "🇮🇩 Indonesian": answer_id
    Footer (muted small text):
      "{provider} · {model} · {prompt_tokens} prompt + {completion_tokens} completion tokens"

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 2 — Core LLM Concepts

**Goal:** Understand tokens, embeddings, inference, and vector DBs in practice.

### Nodes
- [ ] **N6** — Large language models (LLMs)
- [ ] **N7** — Tokens
- [ ] **N8** — Embeddings
- [ ] **N9** — Inference
- [ ] **N10** — Vector DBs (intro)

### Backend prompt — `backend/routers/day02.py`
```
I'm learning AI engineering. Today is Day 2.

Fill in backend/routers/day02.py:

POST /embed
- Accepts {"texts": ["sentence1", ...]}
- Embedding always uses get_embedding_client() (OpenAI only), model=OPENAI_EMBEDDING_MODEL
- Cosine similarity: texts[0] vs all others
- track(day="day02", endpoint="/embed", provider="openai", model="text-embedding-3-small",
        prompt_tokens=usage.total_tokens, completion_tokens=0)
- Returns: {"dimensions": 1536, "total_tokens": N, "provider": "openai",
            "similarity_ranking": [{"text": "...", "score": 0.87}, ...]}

Note: No provider switcher — embedding always uses OpenAI.
Requirements: openai + numpy — no placeholder comments
```

### Frontend prompt — `frontend/app/day-02/page.tsx`
```
I'm learning AI engineering. Today is Day 2.

Replace frontend/app/day-02/page.tsx:

(No ModelSwitcher — embedding is OpenAI-only, show a static "openai · text-embedding-3-small" badge)

- Textarea: sentences one per line
- Submit → POST http://localhost:8000/day02/embed
- Ranked list with similarity % bars
- Footer: "openai · text-embedding-3-small · {total_tokens} tokens"

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 3 — Prompt Engineering

**Goal:** Master zero-shot, few-shot, chain-of-thought, function calling, and caching.

### Nodes
- [ ] **N11** — Prompt engineering basics
- [ ] **N12** — Zero-shot vs few-shot prompting
- [ ] **N13** — Chain of thought (CoT)
- [ ] **N14** — Function calling
- [ ] **N15** — Prompt caching

### Backend prompt — `backend/routers/day03.py`
```
I'm learning AI engineering. Today is Day 3.

Fill in backend/routers/day03.py:

class ClassifyRequest(BaseModel):
    review: str
    technique: str   # "zero_shot" | "few_shot" | "chain_of_thought"
    provider: str | None = None

POST /classify
- client/model/prov from provider.py using req.provider
- All techniques reply as JSON: {result, reasoning_en, reasoning_id}
  zero_shot: ask directly
  few_shot: 3 labeled examples in prompt
  chain_of_thought: reason step by step in both EN+ID before classifying
- response_format={"type": "json_object"}
- call track(...)
- Returns: {"technique", "result", "reasoning_en", "reasoning_id",
            "prompt_tokens", "completion_tokens", "provider", "model"}

Requirements: no placeholder comments
```

### Frontend prompt — `frontend/app/day-03/page.tsx`
```
I'm learning AI engineering. Today is Day 3.

Replace frontend/app/day-03/page.tsx:

State: review (string), provider (string), results map {zero_shot, few_shot, chain_of_thought} each null | response

Layout:
- <ModelSwitcher selected={provider} onChange={setProvider} />
- Textarea for review
- 3 buttons: "Zero-shot", "Few-shot", "Chain of thought"
  Each POSTs {review, technique, provider} to http://localhost:8000/day03/classify
  Updates only its own column
- 3 columns side by side, each:
    technique label + sentiment badge
    reasoning_en card | reasoning_id card
    footer: provider · model · tokens

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 4 — Prompt Engineering Advanced

**Goal:** Control model behavior with system prompts, structured output, and ReAct.

### Nodes
- [ ] **N16** — Structured output
- [ ] **N17** — System prompting
- [ ] **N18** — Role & behavior control
- [ ] **N19** — ReAct (Reasoning + Acting)
- [ ] **N20** — Sampling / temperature

### Backend prompt — `backend/routers/day04.py`
```
I'm learning AI engineering. Today is Day 4.

Fill in backend/routers/day04.py:

POST /structured
- Accepts {"description": str, "provider": str | None}
- System: "Extract product info as JSON: {name, category, price_range, sentiment,
           key_features: [], summary_en, summary_id}"
- response_format={"type": "json_object"}
- call track(...)
- Returns parsed dict + provider + model + token counts

POST /temperature
- Accepts {"prompt": str, "temperatures": list[float], "provider": str | None}
- Calls model once per temperature
- Each reply: JSON {response_en, response_id}
- call track() per call
- Returns {"results": [{temperature, response_en, response_id, tokens}], provider, model}

Requirements: no placeholder comments
```

### Frontend prompt — `frontend/app/day-04/page.tsx`
```
I'm learning AI engineering. Today is Day 4.

Replace frontend/app/day-04/page.tsx — two sections, shared ModelSwitcher at top:

State: provider (string)

Section 1 — Structured output:
- Textarea for product description
- Submit → POST /day04/structured with provider
- Key-value card for extracted fields + summary_en | summary_id cards
- Footer: provider · model · tokens

Section 2 — Temperature:
- Textarea for creative prompt
- Submit → POST /day04/temperature with provider
- 3 result cards (temp 0.0 / 0.7 / 1.4), each: response_en + response_id
- Footer per card

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 5 — AI Models

**Goal:** Know the model landscape — closed, open source, fine-tuning.

### Nodes
- [ ] **N21** — Pre-trained models
- [ ] **N22** — Closed vs open source models
- [ ] **N23** — GPT-4o / Claude / Gemini
- [ ] **N24** — Llama / Mistral / DeepSeek (open source)
- [ ] **N25** — Fine-tuning models

### Backend prompt — `backend/routers/day05.py`
```
I'm learning AI engineering. Today is Day 5.

Fill in backend/routers/day05.py:

POST /compare
- Accepts {"question": str, "provider": str | None}
  provider = which active provider to compare against Ollama
- Makes two calls:
    1. get_client(req.provider) with system: "Reply as JSON {answer_en, answer_id}"
       response_format={"type": "json_object"}, measure latency, call track()
    2. Ollama llama3 via http://localhost:11434/api/generate (plain text, no bilingual)
       measure latency; if unreachable → error fields
- Returns:
  {
    "active": {"provider", "model", "answer_en", "answer_id", "latency_ms",
               "prompt_tokens", "completion_tokens"},
    "ollama": {"model": "llama3", "answer": str, "latency_ms": N | null, "error"?: str}
  }

Requirements: openai + httpx — no placeholder comments
```

### Frontend prompt — `frontend/app/day-05/page.tsx`
```
I'm learning AI engineering. Today is Day 5.

Replace frontend/app/day-05/page.tsx:

- <ModelSwitcher> (picks which provider to compare vs Ollama)
- Textarea for question
- Submit → POST /day05/compare with provider
- Two columns:
    Left  — Active provider: provider/model badge, EN card, ID card, latency, tokens
    Right — Ollama llama3: answer text, latency, or muted "Ollama not running"

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 6 — Embeddings

**Goal:** Build real embedding use cases: search, classification, recommendations.

### Nodes
- [ ] **N26** — What are embeddings?
- [ ] **N27** — Semantic search
- [ ] **N28** — Data classification
- [ ] **N29** — Recommendation systems
- [ ] **N30** — Anomaly detection

### Backend prompt — `backend/routers/day06.py`
```
I'm learning AI engineering. Today is Day 6.

Fill in backend/routers/day06.py:
Embedding uses get_embedding_client() always (OpenAI only).

POST /embed
- Accepts {"text": str}
- track(provider="openai", model="text-embedding-3-small", ...)
- Returns {"embedding": [...], "dimensions": 1536, "tokens_used": N, "provider": "openai"}

POST /search
- Accepts {"query": str, "documents": list[str]}
- Batch embed all, call track()
- Returns {"results": [{"document", "score"}], "tokens_used": N, "provider": "openai"}

Note: no provider switcher — embeddings always OpenAI.
Requirements: openai + numpy — no placeholder comments
```

### Frontend prompt — `frontend/app/day-06/page.tsx`
```
I'm learning AI engineering. Today is Day 6.

Replace frontend/app/day-06/page.tsx — two sections (no ModelSwitcher, static badge):

Section 1 — Semantic search:
- Query input + documents textarea
- Submit → POST /day06/search
- Top 3 results with score bars + "openai · text-embedding-3-small · X tokens"

Section 2 — Embed inspector:
- Text input → POST /day06/embed
- Dimensions + tokens + first 10 values mini bar chart (inline divs)

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 7 — Vector Databases

**Goal:** Store and query embeddings with pgvector.

### Nodes
- [ ] **N31** — What are vector DBs?
- [ ] **N32** — Embedding models (OpenAI, Cohere, Sentence Transformers)
- [ ] **N33** — pgvector / Pinecone / Weaviate
- [ ] **N34** — Indexing embeddings
- [ ] **N35** — Performing similarity search

### Backend prompt — `backend/routers/day07.py`
```
I'm learning AI engineering. Today is Day 7.

Fill in backend/routers/day07.py.
Table `documents` exists. Embedding uses get_embedding_client() (OpenAI only).

POST /ingest — Accepts {"id": str, "text": str}
  Embed + track + upsert. Returns {"id", "dimensions": 1536, "tokens_used", "provider": "openai"}

POST /search — Accepts {"query": str, "top_k": int = 5}
  Embed + track + cosine search. Returns {"results": [{"id","text","score"}], "tokens_used", "provider": "openai"}

GET /documents → [{"id","text"}, ...]

Requirements: openai + psycopg2 + numpy — no placeholder comments
```

### Frontend prompt — `frontend/app/day-07/page.tsx`
```
I'm learning AI engineering. Today is Day 7.

Replace frontend/app/day-07/page.tsx — two panels + doc list (no ModelSwitcher):

Left — Ingest: id input + text textarea → POST /day07/ingest
  Show "Stored [id] — 1536 dims · X tokens · openai"

Right — Search: query + top_k → POST /day07/search
  Ranked results with score bars

Below — Document list: fetch /day07/documents on load + after ingest

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 8 — RAG (Retrieval-Augmented Generation)

**Goal:** Build a full RAG pipeline end to end.

### Nodes
- [ ] **N36** — What is RAG?
- [ ] **N37** — RAG vs fine-tuning
- [ ] **N38** — Implementing RAG (chunking + retrieval)
- [ ] **N39** — Retrieval process
- [ ] **N40** — Generation step

### Backend prompt — `backend/routers/day08.py`
```
I'm learning AI engineering. Today is Day 8.

Fill in backend/routers/day08.py.
Table `rag_chunks` exists.

POST /upload — multipart .txt
  Chunk 500-char/50-char overlap, batch embed (OpenAI), track, insert.
  Returns {"source", "chunks_stored", "tokens_used", "embed_provider": "openai"}

POST /ask — Accepts {"question": str, "provider": str | None}
  1. Embed question (OpenAI, track)
  2. Retrieve top 5 chunks by cosine distance
  3. Generate with get_client(req.provider):
       System: "Answer only using context. Reply as JSON: {answer_en, answer_id}"
     response_format={"type":"json_object"}, track
  Returns:
    {"answer_en", "answer_id", "sources": [...],
     "embed_tokens": N, "gen_tokens": N,
     "gen_provider": prov, "gen_model": model}

Requirements: openai + psycopg2 + python-multipart — no placeholder comments
```

### Frontend prompt — `frontend/app/day-08/page.tsx`
```
I'm learning AI engineering. Today is Day 8.

Replace frontend/app/day-08/page.tsx — two sections:

Section 1 — Upload (no switcher, embedding is OpenAI):
- .txt file input → POST /day08/upload
- "X chunks · Y embed tokens · openai"

Section 2 — Ask (with ModelSwitcher for generation):
State: provider (string)
- <ModelSwitcher> for generation provider
- Question input → POST /day08/ask with provider
- Loader
- EN | ID answer cards
- Collapsible "Sources" section
- Footer: "embed: openai · gen: {gen_provider}/{gen_model} · {embed_tokens}+{gen_tokens} tokens"

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 9 — AI Agents

**Goal:** Build agents with tools, function calling, and multi-agent patterns.

### Nodes
- [ ] **N41** — What are AI agents?
- [ ] **N42** — Agentic use cases
- [ ] **N43** — Tools & function calling in agents
- [ ] **N44** — Multi-agent systems
- [ ] **N45** — Building AI agents (OpenAI / LangGraph)

### Backend prompt — `backend/routers/day09.py`
```
I'm learning AI engineering. Today is Day 9.

Fill in backend/routers/day09.py:

class AgentRequest(BaseModel):
    question: str
    provider: str | None = None

POST /agent
- client/model/prov from provider.py
- 3 tools: search_web, get_weather, calculate (ast safe eval)
- Agentic loop until final text response
- Final turn: force JSON {answer_en, answer_id} with response_format
- Accumulate all loop token counts, call track() once at end
- Returns:
  {"answer_en", "answer_id",
   "steps": [{"tool","args","result"}],
   "total_tokens": N, "provider": prov, "model": model}

Requirements: openai — no placeholder comments
```

### Frontend prompt — `frontend/app/day-09/page.tsx`
```
I'm learning AI engineering. Today is Day 9.

Replace frontend/app/day-09/page.tsx:

- <ModelSwitcher selected={provider} onChange={setProvider} disabled={loading} />
- Input, placeholder: "What is 24 * 7 and what's the weather in Depok?"
- Submit → POST /day09/agent with provider
- "Agent thinking..." loader
- After response:
    EN | ID answer cards side by side
    Steps timeline: tool badge + args + result per step
    Footer: provider · model · total_tokens tokens

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 10 — MCP + Safety + Multimodal

**Goal:** Understand MCP, AI safety principles, and build a multimodal app.

### Nodes
- [ ] **N46** — Model context protocol (MCP)
- [ ] **N47** — AI safety and ethics
- [ ] **N48** — Multimodal AI (image, audio, video)
- [ ] **N49** — OpenAI Vision API / DALL-E
- [ ] **N50** — Development tools (Claude Code, Cursor, Gemini)

### Backend prompt — `backend/routers/day10.py`
```
I'm learning AI engineering. Today is Day 10.

Fill in backend/routers/day10.py:
Vision uses gpt-4o-mini (OpenAI directly — multipart vision not uniform across providers).
Image gen uses dall-e-2.

POST /describe-image
- Accepts JSON {"image_url": str} OR multipart file
- model="gpt-4o-mini" (OpenAI client directly)
- System: "Describe this image. Reply as JSON: {description_en, description_id}"
- response_format={"type":"json_object"}, call track(provider="openai",model="gpt-4o-mini")
- Returns {"description_en","description_id","tokens_used","provider":"openai","model":"gpt-4o-mini"}

POST /generate-image
- Accepts {"prompt": str, "size": "256x256"|"512x512"|"1024x1024"}
- dall-e-2 (OpenAI directly)
- call track(provider="openai",model="dall-e-2",prompt_tokens=1,completion_tokens=0)
- Returns {"image_url","prompt","size","provider":"openai","model":"dall-e-2"}

Note: No provider switcher — vision/image gen are OpenAI only endpoints.
Requirements: openai + python-multipart — no placeholder comments
```

### Frontend prompt — `frontend/app/day-10/page.tsx`
```
I'm learning AI engineering. Today is Day 10.

Replace frontend/app/day-10/page.tsx — two sections (no ModelSwitcher, show static "openai · gpt-4o-mini" badge):

Section 1 — Image describer:
- Toggle URL | Upload → POST /day10/describe-image
- Image preview + EN | ID description cards
- Footer: "openai · gpt-4o-mini · X tokens"

Section 2 — Image generator:
- Prompt textarea + size select → POST /day10/generate-image
- Spinner → generated image + caption
- Footer: "openai · dall-e-2 · $0.0018/image"

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Progress tracker

| Day | Topic | Backend | Frontend |
|-----|-------|---------|----------|
| 0 | Scaffold + token tracker | ☐ | ☐ |
| 1 | Intro + LLM basics | ☐ | ☐ |
| 2 | Core LLM concepts | ☐ | ☐ |
| 3 | Prompt engineering | ☐ | ☐ |
| 4 | Prompt eng. advanced | ☐ | ☐ |
| 5 | AI models | ☐ | ☐ |
| 6 | Embeddings | ☐ | ☐ |
| 7 | Vector databases | ☐ | ☐ |
| 8 | RAG | ☐ | ☐ |
| 9 | AI agents | ☐ | ☐ |
| 10 | MCP + safety + multimodal | ☐ | ☐ |
