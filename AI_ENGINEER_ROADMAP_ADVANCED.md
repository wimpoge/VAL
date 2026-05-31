# VAL — Visual AI Learning
> Day 11–20 · 50 nodes (N51–N100) · Stack: **Next.js 14 App Router + Python (FastAPI)** · Per-request model switcher · Bilingual (EN + ID)

> 📝 This file extends AI_ENGINEER_ROADMAP.md. All global rules (provider switching, token tracking, ModelSwitcher) carry over unchanged. New routers mount at /day11 … /day20.

> 🧭 **Where Day 11–20 lives.** The visual curriculum pages live in the **main VAL frontend** (port 3000) under `frontend/app/advanced-ai/day-XX/page.tsx` — one navigation level beneath the Day 1–10 pages. The **Advanced** button in the navbar opens `/advanced-ai`, which is the Day 11–20 index page. Day 1–10 stays in the existing day-chip nav; Day 11–20 is reached only via the Advanced button so the beginner experience doesn't get crowded.

---

## Project structure additions

```
ai-engineer-roadmap/
├── backend/
│   └── routers/
│       └── day11.py … day20.py            ← add these (mount at /day11 … /day20)
└── frontend/
    └── app/
        └── advanced-ai/
            ├── page.tsx                   ← Day 11-20 index (cards grid)
            ├── day-11/page.tsx
            ├── day-12/page.tsx
            ├── day-13/page.tsx
            ├── day-14/page.tsx
            ├── day-15/page.tsx
            ├── day-16/page.tsx
            ├── day-17/page.tsx
            ├── day-18/page.tsx
            ├── day-19/page.tsx
            └── day-20/page.tsx            ← all served at localhost:3000/advanced-ai/day-XX
```

---


## Day 11 — Vector DB Landscape

**Goal:** Compare five vector engines — embedded, managed, and self-hosted — and know when to pick each.

### System requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Any dual-core | Quad-core+ |
| RAM | 4 GB | 8 GB |
| GPU | Not required | Not required |
| Storage | 500 MB | 1 GB |
| Network | Required (API calls) | Required |
| Notes | All vector DBs run in-memory or locally. No GPU needed — this day is pure API + concept. |

### Nodes

- [ ] **N51** — FAISS
  - **Visual idea:** Animated 3-step flow: numpy float matrix → FAISS index builder → search results. Three index type pills (Flat / IVF / HNSW) are togglable; each shows a speed-vs-recall bar on hover.

- [ ] **N52** — ChromaDB
  - **Visual idea:** Card-by-card pipeline animation: Documents → Embed → Store → Query → Results. Each card pulses when active. Metadata filter badge appears between Store and Query to show filtering step.

- [ ] **N53** — Qdrant
  - **Visual idea:** Architecture diagram: Client → REST/gRPC → Collection → HNSW graph nodes. A payload filter chip narrows visible result nodes in real time as user types a filter value.

- [ ] **N54** — Weaviate
  - **Visual idea:** Hybrid search funnel — BM25 lane (blue) and vector lane (teal) merge into one ranked list. A slider controls BM25 vs vector weight; lane widths animate accordingly.

- [ ] **N55** — Pinecone
  - **Visual idea:** Radar/spider chart comparing all five engines on five axes: managed, filter support, scale, cost, setup ease. Each engine is one colored polygon; user can toggle engines on/off.

### Backend prompt — backend/routers/day11.py

```
I'm learning AI engineering. Today is Day 11.

Fill in backend/routers/day11.py.

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

POST /ask
- Accepts AskRequest
- client = get_client(req.provider), model = get_model(req.provider), prov = get_provider(req.provider)
- System: BEGINNER_SYSTEM_PROMPT +
  "Today's topic is vector database engines: FAISS, ChromaDB, Qdrant, Weaviate, Pinecone.
   Focus on when to choose each, their trade-offs, and how they differ.
   Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}
- call track(day="day11", endpoint="/ask", provider=prov, model=model,
             prompt_tokens=usage.prompt_tokens, completion_tokens=usage.completion_tokens)
- Returns: {"answer_en", "answer_id", "prompt_tokens", "completion_tokens", "provider", "model"}

POST /compare
- Accepts {"provider": str | None}
- Prompt: compare FAISS, ChromaDB, Qdrant, Weaviate, Pinecone on five axes (score 1–5):
  managed, filter_support, scale, cost_efficiency, setup_ease
  also include: best_for (one phrase), type ("embedded"|"self-hosted"|"managed")
  Reply as JSON: {"engines": [{"name","type","managed","filter_support","scale","cost_efficiency","setup_ease","best_for"}]}
- response_format={"type": "json_object"}
- track as above
- Returns parsed engines array + provider/model metadata

Requirements: from provider import get_client, get_model, get_provider, BEGINNER_SYSTEM_PROMPT
              from token_tracker import track — no placeholder comments
```

### Frontend prompt — frontend/app/advanced-ai/day-11/page.tsx

```
I'm learning AI engineering. Today is Day 11: Vector DB Landscape.

Replace frontend/app/advanced-ai/day-11/page.tsx.

State: question, provider (default "openai"), result, compareData, loading, compareLoading

SECTION 1 — Ask anything
- <ModelSwitcher selected={provider} onChange={setProvider} disabled={loading} />
- Text input, placeholder: "When should I use Qdrant instead of Pinecone?"
- Submit → POST /day11/ask
- EN | ID answer cards + footer

SECTION 2 — Visual: Engine radar chart + comparison table
- "Compare all engines" button → POST /day11/compare
- On response render TWO visuals side by side:

  LEFT — Spider/radar chart (SVG, no library):
    Five axes: Managed · Filter support · Scale · Cost efficiency · Setup ease
    Each engine is one colored polygon (FAISS=blue, ChromaDB=teal, Qdrant=purple,
    Weaviate=amber, Pinecone=coral). Scores 1–5 map to axis length.
    Clickable legend toggles each engine polygon on/off.
    Hover a polygon vertex: show tooltip with engine name + axis score.

  RIGHT — Comparison table:
    Columns: Engine | Type badge | Best for | (5 score columns as colored dots 1–5)
    Type badge: "embedded"=gray, "self-hosted"=blue, "managed"=green pill
    Score dots: filled circles, color intensity = score value

- Below both visuals: a 5-card row (one per engine) showing name + best_for + type badge

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no external chart library — no placeholder comments
```

---

## Day 12 — ML Frameworks

**Goal:** Understand PyTorch, TensorFlow/Keras, HuggingFace, Transformers, and ONNX — how they fit together.

### System requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Any dual-core | Quad-core+ |
| RAM | 4 GB | 16 GB (if running PyTorch locally) |
| GPU | Not required (API mode) | NVIDIA 8 GB VRAM (if running local HF model) |
| CUDA | Not required (API mode) | CUDA 11.8+ for PyTorch GPU · CUDA 12.1+ for faster training |
| cuDNN | Not required | cuDNN 8.6+ (pairs with CUDA 11.8) / cuDNN 9.x (pairs with CUDA 12.x) |
| Storage | 500 MB | 5 GB (model weights if downloaded) |
| Network | Required (HuggingFace Hub, API calls) | Required |
| Notes | Day 12 teaches frameworks conceptually via API — no GPU needed for the interactive demo. If you want to run a HuggingFace model locally: install CUDA 12.1 + cuDNN 9.x + PyTorch with `pip install torch --index-url https://download.pytorch.org/whl/cu121`. Check compatibility at pytorch.org/get-started. |

### Nodes

- [ ] **N56** — PyTorch
  - **Visual idea:** Animated forward pass: input tensor → linear layer → activation → loss → backward arrows glow amber (gradient flow). A "run forward pass" button triggers the animation step by step.

- [ ] **N57** — TensorFlow / Keras
  - **Visual idea:** Stack diagram: Keras (top layer, high-level) → TensorFlow (middle, computation graph) → XLA / Hardware (bottom). Each layer is a horizontal band; click to expand with a one-line description.

- [ ] **N58** — HuggingFace Hub
  - **Visual idea:** Annotated model card mockup — tags (task, language, license), download count badge, metrics table, and "from_pretrained()" code snippet that appears when user clicks a model card.

- [ ] **N59** — Transformers library
  - **Visual idea:** Pipeline abstraction diagram: raw text → Tokenizer → Model → Post-processor → output. Each stage is a colored box; a live "try it" mini-demo calls the backend and shows the tokenized chips and output side by side.

- [ ] **N60** — ONNX Runtime
  - **Visual idea:** Export pipeline flow: PyTorch model → torch.onnx.export() → .onnx file → ONNX Runtime → Hardware target icons (CPU / CUDA / CoreML). Each arrow is labeled with the transformation happening.

### Backend prompt — backend/routers/day12.py

```
I'm learning AI engineering. Today is Day 12.

Fill in backend/routers/day12.py.

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

POST /ask
- System: BEGINNER_SYSTEM_PROMPT +
  "Today's topic is ML frameworks: PyTorch, TensorFlow/Keras, HuggingFace Hub,
   the Transformers library, and ONNX Runtime. Focus on how they relate to each other,
   when to use each, and beginner-friendly analogies.
   Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}, track, return standard shape

POST /framework-map
- Accepts {"provider": str | None}
- Prompt: return the ML framework ecosystem as JSON:
  {"frameworks": [{"name","layer","use_case","runs_on_top_of":[names],"color_hint":"blue"|"teal"|"amber"|"purple"|"coral"}]}
  layer = "hardware" | "low_level" | "high_level" | "hub" | "runtime"
  Include: PyTorch, TensorFlow, Keras, HuggingFace Hub, Transformers, ONNX Runtime, llama.cpp
- response_format={"type": "json_object"}, track, return parsed map + metadata

Requirements: from provider import get_client, get_model, get_provider, BEGINNER_SYSTEM_PROMPT
              from token_tracker import track — no placeholder comments
```

### Frontend prompt — frontend/app/advanced-ai/day-12/page.tsx

```
I'm learning AI engineering. Today is Day 12: ML Frameworks.

Replace frontend/app/advanced-ai/day-12/page.tsx.

SECTION 1 — Ask anything (standard pattern)
- <ModelSwitcher />, text input, POST /day12/ask, EN|ID cards, footer

SECTION 2 — Visual: Framework ecosystem map
- "Show ecosystem map" button → POST /day12/framework-map
- Render a layered stack diagram (SVG or divs):
    5 horizontal layers from bottom to top:
      Hardware (gray) → Low-level (blue) → High-level (teal) → Hub (amber) → Runtime (purple)
    Each framework is a pill/card placed in its layer row.
    Arrows connect frameworks that "run_on_top_of" each other (SVG lines from child to parent layer).
    Clicking a framework card opens an inline tooltip showing: name, use_case, runs_on_top_of list.
    Layer labels on the left side, color-matched to the layer band.
  Animate cards fading in bottom-to-top on first load.

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no external chart library — no placeholder comments
```

---

## Day 13 — Cloud AI Platforms

**Goal:** Understand AWS Bedrock, GCP Vertex AI, Azure OpenAI, Alibaba DashScope, and free GPU options.

### System requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Any dual-core | Any |
| RAM | 4 GB | 4 GB |
| GPU | Not required | Not required |
| Storage | 200 MB | 200 MB |
| Network | Required (cloud dashboards + API calls) | Required |
| Notes | All cloud platforms are accessed via browser/API — no local GPU. You need a cloud account (AWS/GCP/Azure/Alibaba). Free tiers are sufficient for all exercises. |

### Nodes

- [ ] **N61** — AWS Bedrock
  - **Visual idea:** Architecture card: App → Bedrock API Gateway → Model zoo (Claude / Titan / Llama cards in a row) → Response. IAM lock icon on the gateway. Hover each model card to see a one-line description.

- [ ] **N62** — GCP Vertex AI
  - **Visual idea:** MLOps lifecycle ring (not a flowchart — an actual circular ring): Data → Train → Evaluate → Deploy → Monitor → back to Data. Each stage is an arc segment; click to highlight and show the Vertex service name.

- [ ] **N63** — Azure OpenAI
  - **Visual idea:** Side-by-side comparison: OpenAI.com vs Azure OpenAI — same models, different wrappers. A "what changes" diff view highlights: base_url, auth method, data residency, compliance badges.

- [ ] **N64** — Alibaba DashScope
  - **Visual idea:** World map SVG highlighting SEA/APAC region with a callout showing Qwen model family and DashScope API endpoint. Language coverage bar: EN / ZH / ID / others.

- [ ] **N65** — Kaggle / Google Colab
  - **Visual idea:** GPU quota meter — weekly hours bar (Kaggle T4) and session timer (Colab). A "free vs pro" comparison table with GPU type, RAM, session length, and persistent storage columns.

### Backend prompt — backend/routers/day13.py

```
I'm learning AI engineering. Today is Day 13.

Fill in backend/routers/day13.py.

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

POST /ask
- System: BEGINNER_SYSTEM_PROMPT +
  "Today's topic is cloud AI platforms: AWS Bedrock, GCP Vertex AI, Azure OpenAI,
   Alibaba DashScope, Kaggle, and Google Colab.
   Focus on when to choose each, pricing model, and compliance strengths.
   Note: this app teaches these as concepts — the live demo uses our existing providers
   (OpenAI/Groq/DeepSeek/Gemini), not the cloud platforms themselves.
   Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}, track, return standard shape

POST /platform-compare
- Accepts {"provider": str | None}
- Prompt: return JSON {"platforms": [{"name","vendor","vendor_color":"orange"|"blue"|"indigo"|"red"|"green",
  "managed":bool,"free_tier":bool,"compliance":["SOC2","HIPAA",...],
  "best_for","pricing_model":"per-token"|"per-seat"|"usage-based"}]}
  for: AWS Bedrock, GCP Vertex AI, Azure OpenAI, Alibaba DashScope, Kaggle, Google Colab
- response_format={"type": "json_object"}, track, return parsed platforms + metadata

Requirements: from provider import get_client, get_model, get_provider, BEGINNER_SYSTEM_PROMPT
              from token_tracker import track — no placeholder comments
```

### Frontend prompt — frontend/app/advanced-ai/day-13/page.tsx

```
I'm learning AI engineering. Today is Day 13: Cloud AI Platforms.

Replace frontend/app/advanced-ai/day-13/page.tsx.

SECTION 1 — Ask anything (standard pattern)
- <ModelSwitcher />, text input placeholder: "What is AWS Bedrock and when should I use it?",
  POST /day13/ask, EN|ID cards, footer

SECTION 2 — Visual: Platform comparison
- "Compare platforms" button → POST /day13/platform-compare
- Render TWO visuals:

  TOP — Card grid (2×3):
    Each platform = a card with:
      Vendor color bar on top (orange=AWS, blue=GCP, indigo=Azure, red=Alibaba, green=Google)
      Platform name (bold) + vendor badge
      Managed: ✓/✗ pill · Free tier: ✓/✗ pill
      Pricing model badge (per-token / per-seat / usage-based)
      Best for: italic muted text
      Compliance badges: small gray pills (SOC2, HIPAA, etc.)

  BOTTOM — Feature matrix table:
    Rows = platforms, Columns = Managed | Free tier | SOC2 | HIPAA | OpenAI-compatible API | Best for
    Cells: ✓ (green) / ✗ (gray) / text
    Sticky header row

- Note banner (amber): "This day teaches cloud platforms as concepts.
  The live Q&A above uses our existing providers (OpenAI / Groq / DeepSeek / Gemini)."

SECTION 3 — "Try it yourself" practical launcher (always visible)
  Title: "Try it yourself — go to the dashboard"
  Subtitle: "Each provider below has a free tier or lowest-cost entry point. Click to open the dashboard."

  Six provider cards in a 2×3 grid. Each card contains:
    - Vendor color left border
    - Provider name + logo placeholder (colored icon initial)
    - "Lowest cost entry" badge — one specific cheap/free option
    - Bullet list of 2-3 practical steps to get started
    - Estimated cost badge (green if free, amber if < $1, gray if variable)
    - "Open dashboard →" button that opens the URL in a new tab

  Card data (hardcoded):

  AWS Bedrock:
    color: orange
    lowest_entry: "us-east-1 · amazon.titan-text-lite-v1 · ~$0.0003/1K tokens"
    steps:
      - "Sign in to AWS Console → search Bedrock"
      - "Go to Model access → enable Titan Text Lite (free to request)"
      - "Open Playgrounds → Chat → pick Titan Text Lite"
    cost_badge: "~$0.30/1M tokens"
    dashboard_url: "https://console.aws.amazon.com/bedrock"

  GCP Vertex AI:
    color: blue
    lowest_entry: "gemini-2.0-flash · free tier up to 15 req/min"
    steps:
      - "Go to console.cloud.google.com → enable Vertex AI API"
      - "Open Vertex AI Studio → pick Gemini 2.0 Flash"
      - "Free tier: 15 RPM, 1M tokens/day at no cost"
    cost_badge: "Free tier available"
    dashboard_url: "https://console.cloud.google.com/vertex-ai"

  Azure OpenAI:
    color: indigo
    lowest_entry: "gpt-4o-mini · $0.15/1M input tokens"
    steps:
      - "Go to portal.azure.com → create Azure OpenAI resource"
      - "Open Azure OpenAI Studio → Deployments → deploy gpt-4o-mini"
      - "Use Chat playground or copy the endpoint to your code"
    cost_badge: "$0.15/1M input"
    dashboard_url: "https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub"

  Alibaba DashScope:
    color: red
    lowest_entry: "qwen-turbo · ~$0.001/1K tokens · free trial quota"
    steps:
      - "Sign up at dashscope.aliyun.com (international account works)"
      - "Go to API-KEY management → create a key"
      - "Use qwen-turbo — cheapest Qwen model, OpenAI-compatible API"
    cost_badge: "Free trial + ~$0.001/1K"
    dashboard_url: "https://dashscope.aliyun.com"

  Kaggle:
    color: cyan
    lowest_entry: "T4 GPU · 30 hrs/week free · zero signup cost"
    steps:
      - "Sign in at kaggle.com → New Notebook"
      - "Settings → Accelerator → GPU T4 x2"
      - "Run any HuggingFace model or Ollama inside the notebook"
    cost_badge: "100% Free"
    dashboard_url: "https://www.kaggle.com/code"

  Google Colab:
    color: green
    lowest_entry: "T4 GPU · free tier · Colab Pro = $9.99/mo for more"
    steps:
      - "Go to colab.research.google.com → New notebook"
      - "Runtime → Change runtime type → T4 GPU"
      - "pip install any ML library — environment resets each session"
    cost_badge: "Free / $9.99 Pro"
    dashboard_url: "https://colab.research.google.com"

  Style: cards have a subtle hover lift (shadow + translateY). The "Open dashboard →"
  button is the vendor color. Cost badge: green=free, amber=paid but cheap, gray=variable.

SECTION 4 — Cost comparison quick reference (always visible)
  A compact horizontal table: Provider | Cheapest model | Input cost | Output cost | Free tier
  Sorted cheapest input first.
  Data (hardcoded):
    Kaggle          | T4 GPU notebook      | Free        | Free        | ✓ 30h/week
    Google Colab    | T4 GPU notebook      | Free        | Free        | ✓ limited
    GCP Vertex AI   | gemini-2.0-flash     | Free        | Free        | ✓ 1M tok/day
    Alibaba         | qwen-turbo           | ~$0.001/1K  | ~$0.001/1K  | ✓ trial quota
    AWS Bedrock     | titan-text-lite      | $0.0003/1K  | $0.0004/1K  | ✗
    Azure OpenAI    | gpt-4o-mini          | $0.00015/1K | $0.0006/1K  | ✗

  Footer note (muted): "Prices as of mid-2025. Always check provider pricing page before production use."

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 14 — Local Model Inference

**Goal:** Run open-source LLMs locally — no API key, no cloud bill — and understand Ollama, vLLM, TGI, llama.cpp, and LM Studio.

### System requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4-core (for CPU inference) | 8-core+ |
| RAM | 8 GB (for 7B model CPU) | 16 GB+ |
| GPU | Not required (CPU mode) | NVIDIA 8 GB+ VRAM |
| CUDA | Not required (CPU mode) | CUDA 12.1+ (vLLM, llama.cpp GPU, Ollama GPU) |
| cuDNN | Not required | cuDNN 9.x (pairs with CUDA 12.x) |
| Storage | 4 GB (7B GGUF Q4 model) | 10 GB+ |
| Network | Required for model download | Required |
| CUDA per tool | | |
| Ollama GPU | CUDA 11.8+ | CUDA 12.1+ |
| llama.cpp GPU | CUDA 12.1+ | CUDA 12.1+ |
| vLLM | CUDA 12.1+ (Linux only) | CUDA 12.4+ |
| TGI | CUDA 11.8+ | CUDA 12.1+ |
| LM Studio | No CUDA (uses llama.cpp CPU/Metal) | CUDA 12.1+ for GPU layers |
| Notes | CPU mode: Ollama + llama.cpp run 7B Q4 on 8 GB RAM (~3–5 tok/s). GPU mode: RTX 3060 12 GB handles 13B Q4 at ~30 tok/s. RTX 3090/4090 handles 70B Q4. vLLM requires Linux + CUDA 12.1+ — does not run on Windows natively. Install CUDA toolkit: developer.nvidia.com/cuda-downloads. |

### Nodes

- [ ] **N66** — Ollama
  - **Visual idea:** Step-by-step terminal animation (monospace, dark bg): `ollama run llama3` → download progress bar → "model loaded" → prompt cursor blinks. A "what happened" callout explains each step.

- [ ] **N67** — vLLM
  - **Visual idea:** PagedAttention diagram — traditional KV cache (one big fixed block, lots of wasted gray space) vs PagedAttention (small pages allocated on demand, no waste). Slider shows "concurrent requests" — traditional fills up fast, paged handles more.

- [ ] **N68** — TGI
  - **Visual idea:** Docker-first flow: `docker run` → TGI container → HuggingFace Hub model download → OpenAI-compatible endpoint live. Each step is a terminal card that appears in sequence.

- [ ] **N69** — llama.cpp
  - **Visual idea:** Quantization precision spectrum: FP32 → BF16 → INT8 → INT4 as a horizontal bar. Model size and quality bars shrink/grow as user drags a precision slider. A "fits on device" indicator shows which fits in 8GB / 16GB / 24GB RAM.

- [ ] **N70** — LM Studio
  - **Visual idea:** GUI mockup screenshot-style layout: model browser sidebar, chat panel, server toggle. Annotated with callout labels pointing to key features (local server port, model selector, GPU layers slider).

### Backend prompt — backend/routers/day14.py

```
I'm learning AI engineering. Today is Day 14.

Fill in backend/routers/day14.py.

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

POST /ask
- System: BEGINNER_SYSTEM_PROMPT +
  "Today's topic is local LLM inference: Ollama, vLLM, TGI, llama.cpp, and LM Studio.
   Focus on setup complexity, throughput, GPU requirements, and when to use each.
   Note: this app teaches these as concepts — the live demo uses cloud providers.
   Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}, track, return standard shape

POST /runtime-compare
- Accepts {"provider": str | None}
- Prompt: return JSON {"runtimes": [{"name",
  "setup":"easy"|"medium"|"advanced",
  "throughput":"low"|"medium"|"high",
  "gpu_required":bool, "gui":bool, "api_compatible":bool,
  "best_for", "quantization_support":bool,
  "ram_8gb":bool, "ram_16gb":bool}]}
  for: Ollama, vLLM, TGI, llama.cpp, LM Studio
- response_format={"type": "json_object"}, track, return parsed runtimes + metadata

Requirements: from provider import get_client, get_model, get_provider, BEGINNER_SYSTEM_PROMPT
              from token_tracker import track — no placeholder comments
```

### Frontend prompt — frontend/app/advanced-ai/day-14/page.tsx

```
I'm learning AI engineering. Today is Day 14: Local Model Inference.

Replace frontend/app/advanced-ai/day-14/page.tsx.

SECTION 1 — Ask anything (standard pattern)
- <ModelSwitcher />, text input placeholder: "How do I run Llama 3 locally with Ollama?",
  POST /day14/ask, EN|ID cards, footer

SECTION 2 — Visual: Runtime comparison
- "Compare runtimes" button → POST /day14/runtime-compare
- Render TWO visuals:

  TOP — Comparison table:
    Columns: Runtime | Setup | Throughput | GPU required | GUI | API compatible | 8GB RAM | 16GB RAM | Best for
    Setup pill: easy=green, medium=amber, advanced=red
    Throughput pill: low=gray, medium=blue, high=green
    Boolean columns: ✓ green / ✗ gray

  BOTTOM — Visual: PagedAttention explainer (for vLLM node)
    Two side-by-side boxes labeled "Traditional KV cache" and "PagedAttention (vLLM)":
      Traditional: one tall fixed block, top portion filled (blue), bottom gray (wasted)
      PagedAttention: many small page blocks, only filled ones shown, gaps tight
    A slider "Concurrent requests: 1–16" — as requests increase, traditional shows
    red "OUT OF MEMORY" overlay faster than PagedAttention.
    Label: "This is why vLLM handles more users per GPU."

SECTION 3 — Visual: Quantization precision slider (for llama.cpp node)
  Horizontal precision bar: FP32 → BF16 → INT8 → INT4
  Draggable handle. As user drags:
    Model size bar: shrinks (FP32=100% → INT4=~25%)
    Quality bar: shrinks slightly (FP32=100% → INT4=~88%)
    "Fits in" indicator: lights up "8GB ✓" / "16GB ✓" / "24GB ✓" based on size
  Static note: "llama.cpp uses GGUF format. Ollama uses llama.cpp under the hood."

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no external chart library — no placeholder comments
```

---

## Day 15 — Observability & Evals

**Goal:** Trace every LLM call, score outputs automatically, and catch regressions before users do.

### System requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Any dual-core | Quad-core+ |
| RAM | 4 GB | 8 GB |
| GPU | Not required | Not required |
| Storage | 200 MB | 200 MB |
| Network | Required (LangSmith/Langfuse API, LLM calls) | Required |
| Notes | All observability tools are cloud-hosted or lightweight local. The LLM-as-judge eval demo makes API calls — no local GPU needed. Langfuse can be self-hosted if privacy is a concern. |

### Nodes

- [ ] **N71** — LangSmith
  - **Visual idea:** Trace waterfall diagram — root span (chain) expands into child spans (retriever, LLM call, parser) as colored horizontal bars with latency labels. Click a span to see input/output payload.

- [ ] **N72** — Langfuse
  - **Visual idea:** OTel pipeline diagram: App code → @observe decorator → Langfuse SDK → Langfuse dashboard. A second branch shows the OpenAI proxy path. Both paths converge at the same dashboard view.

- [ ] **N73** — RAGAS
  - **Visual idea:** 2×2 metric grid — Faithfulness / Answer Relevancy / Context Precision / Context Recall. Each cell has: metric name, one-sentence definition, and a 0→1 animated score bar that fills on load.

- [ ] **N74** — Weave (W&B)
  - **Visual idea:** Timeline chart showing training runs (W&B Experiments) and inference traces (Weave) on the same project timeline. Arrows connect a training run to the deployed model to its production traces.

- [ ] **N75** — OpenTelemetry for LLMs
  - **Visual idea:** Fan-out diagram: one OTel SDK in the app → exporters branch out to multiple backends (Langfuse / Grafana / Honeycomb / LangSmith) as destination cards. gen_ai.* span attributes listed as pills on the center line.

### Backend prompt — backend/routers/day15.py

```
I'm learning AI engineering. Today is Day 15.

Fill in backend/routers/day15.py.

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

class EvalRequest(BaseModel):
    question: str
    context: str
    answer: str
    provider: str | None = None

POST /ask
- System: BEGINNER_SYSTEM_PROMPT +
  "Today's topic is LLM observability and evaluation: LangSmith, Langfuse, RAGAS,
   Weights & Biases Weave, and OpenTelemetry for LLMs.
   Focus on how to trace, score, and improve AI apps in production.
   Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}, track, return standard shape

POST /eval-score
- Accepts EvalRequest
- System: "You are an evaluator. Given a question, a context, and an answer,
   score on three RAGAS-inspired metrics (0.0 to 1.0):
   faithfulness: is the answer grounded in the context?
   answer_relevancy: does the answer address the question?
   context_precision: does the context contain what's needed?
   Reply only as JSON:
   {faithfulness, answer_relevancy, context_precision,
    explanation_en, explanation_id,
    verdict: 'pass'|'warn'|'fail'}"
  verdict: pass if all >= 0.7, warn if any between 0.4–0.7, fail if any < 0.4
- response_format={"type": "json_object"}, track, return parsed scores + metadata

Requirements: from provider import get_client, get_model, get_provider, BEGINNER_SYSTEM_PROMPT
              from token_tracker import track — no placeholder comments
```

### Frontend prompt — frontend/app/advanced-ai/day-15/page.tsx

```
I'm learning AI engineering. Today is Day 15: Observability & Evals.

Replace frontend/app/advanced-ai/day-15/page.tsx.

SECTION 1 — Ask anything (standard pattern)
- <ModelSwitcher />, text input placeholder: "What is the difference between LangSmith and Langfuse?",
  POST /day15/ask, EN|ID cards, footer

SECTION 2 — Visual: LLM-as-judge eval scorer
- Three inputs:
    Question (text input)
    Context (textarea, placeholder: "Paste the retrieved context here")
    Answer (textarea, placeholder: "Paste the LLM answer to evaluate")
- <ModelSwitcher /> for the judge model
- "Score this answer" button → POST /day15/eval-score

- On response render:
  TOP — Verdict banner:
    pass=green bg "✓ Looks good", warn=amber "⚠ Review needed", fail=red "✗ Needs improvement"

  MIDDLE — Three animated metric bars:
    Faithfulness        [████████░░]  0.82
    Answer relevancy    [█████████░]  0.91
    Context precision   [███████░░░]  0.74
    Bar fill color: green >= 0.7, amber 0.4–0.69, red < 0.4
    Bars animate from 0 to score value on mount (CSS transition width)
    Hover a bar: tooltip with metric definition

  BOTTOM — Explanation in EN | ID toggle cards

  Visual: RAGAS metric explainer (always visible, above the form):
    2×2 static grid of metric cards:
      Faithfulness | Answer relevancy
      Context precision | (Context recall — coming soon, grayed out)
    Each card: metric name (bold) + one-sentence plain definition + a small icon

- Footer: provider · model · tokens

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 16 — LLM Frameworks

**Goal:** Go from simple chains (LangChain LCEL) to stateful graphs (LangGraph) and multi-agent crews (CrewAI).

### System requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Any dual-core | Quad-core+ |
| RAM | 4 GB | 8 GB |
| GPU | Not required | Not required |
| Storage | 500 MB (pip packages) | 1 GB |
| Network | Required (API calls) | Required |
| Notes | LangChain, LlamaIndex, LangGraph, CrewAI all run via cloud LLM APIs — no local GPU. Heavy pip installs (~500 MB). The agent demos make multiple sequential API calls so expect slightly higher token usage. |

### Nodes

- [ ] **N76** — LangChain core (LCEL)
  - **Visual idea:** Pipe diagram: PromptTemplate → ChatOpenAI → StrOutputParser as three linked nodes with a "|" pipe symbol between them. A "run" button animates a token flowing through the chain left to right.

- [ ] **N77** — LangChain agents + tools
  - **Visual idea:** ReAct loop cycle: Thought → Action (tool badge) → Observation → back to Thought → Final Answer. Each iteration is a row; user can step through iterations with a Next button showing real tool call examples.

- [ ] **N78** — LlamaIndex
  - **Visual idea:** Ingestion vs query split diagram. Left side (ingestion): PDF/DB/API → Node parser → Index. Right side (query): Query → Retriever → Synthesizer → Response. A vertical divider separates the two phases.

- [ ] **N79** — LangGraph
  - **Visual idea:** State graph with clickable nodes: Agent → (conditional edge) → Tools → Agent → END. Node color changes as "execution" steps through. State object shown as a live JSON panel that updates at each step.

- [ ] **N80** — CrewAI
  - **Visual idea:** Three agent cards in a row (Researcher → Writer → Reviewer) with task handoff arrows between them. Each card shows role, goal, and tools. A "kickoff" button animates the task flowing left to right through the crew.

### Backend prompt — backend/routers/day16.py

```
I'm learning AI engineering. Today is Day 16.

Fill in backend/routers/day16.py.

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

class FrameworkPickerRequest(BaseModel):
    use_case: str   # "simple_chain"|"doc_qa"|"stateful_agent"|"multi_agent"|"raw_api"
    provider: str | None = None

POST /ask
- System: BEGINNER_SYSTEM_PROMPT +
  "Today's topic is LLM orchestration frameworks: LangChain (LCEL + agents),
   LlamaIndex, LangGraph, and CrewAI.
   Focus on what each is best for, how they relate, and when to use raw API calls instead.
   Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}, track, return standard shape

POST /framework-picker
- Accepts FrameworkPickerRequest
- Prompt: "Given use case '{use_case}', recommend the best LLM framework.
   Reply as JSON: {framework, reason_en, reason_id,
   alternatives:[str], complexity:'low'|'medium'|'high',
   react_loop_steps: null | [{step:'Thought'|'Action'|'Observation', example:str}]}"
   react_loop_steps: only for use_case='stateful_agent' or 'multi_agent', else null
- response_format={"type": "json_object"}, track, return parsed recommendation + metadata

Requirements: from provider import get_client, get_model, get_provider, BEGINNER_SYSTEM_PROMPT
              from token_tracker import track — no placeholder comments
```

### Frontend prompt — frontend/app/advanced-ai/day-16/page.tsx

```
I'm learning AI engineering. Today is Day 16: LLM Frameworks.

Replace frontend/app/advanced-ai/day-16/page.tsx.

SECTION 1 — Ask anything (standard pattern)
- <ModelSwitcher />, text input placeholder: "What is the difference between LangGraph and CrewAI?",
  POST /day16/ask, EN|ID cards, footer

SECTION 2 — Visual: Framework picker + ReAct loop stepper
- Five use-case toggle pills (select one):
    Simple chain | Doc Q&A | Stateful agent | Multi-agent | Raw API
- <ModelSwitcher /> + "Pick framework" button → POST /day16/framework-picker

- On response:
  TOP — Result card:
    Recommended framework (large bold) + complexity badge (low=green, medium=amber, high=red)
    Reason: EN | ID toggle
    Alternatives: pill badges

  MIDDLE — Visual: LCEL pipe diagram (always visible):
    Three boxes connected by "|" pipe symbols:
      [PromptTemplate] | [ChatOpenAI] | [StrOutputParser]
    Each box has a colored top border (teal/blue/purple)
    "Animate chain" button: a dot travels left to right through the pipes

  BOTTOM — If react_loop_steps is not null: ReAct loop stepper:
    Vertical timeline of steps: Thought → Action → Observation → Thought → Final Answer
    Each step is a card with: step type badge + example text
    "Step through" button highlights one step at a time
    Action steps show a tool badge (search_web / calculate / get_weather)

SECTION 3 — Visual: Framework comparison cards (always visible)
  Four cards in a row: LangChain | LlamaIndex | LangGraph | CrewAI
  Each card: name, one-line description, best_for tag, complexity badge
  Static — no API call needed, hardcoded from known facts

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 17 — Production & Deployment

**Goal:** Ship an AI app and keep it running — Docker, CI/CD, cost optimization, health checks, zero-downtime deploys.

### System requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Any dual-core | Quad-core+ |
| RAM | 4 GB | 8 GB |
| GPU | Not required | Not required |
| Storage | 1 GB (Docker images) | 5 GB |
| Network | Required | Required |
| Other | Docker Desktop installed | Docker Desktop + GitHub account |
| Notes | Docker must be installed to follow the Dockerfile exercises. CI/CD demos reference GitHub Actions — a free GitHub account is sufficient. No GPU required for any exercise in this day. |

### Nodes

- [ ] **N81** — Dockerizing AI apps
  - **Visual idea:** Multi-stage Dockerfile diagram: Stage 1 "builder" (install all deps, large) → Stage 2 "runtime" (copy only dist, small). Two containers shown with size bar comparison. Hover each layer to see what it adds.

- [ ] **N82** — CI/CD for AI apps
  - **Visual idea:** GitHub Actions pipeline flowchart: push to main → lint/test → build Docker image → push to registry → SSH deploy → health check → green "deployed" badge. Each step is a card; red X on any step shows rollback arrow.

- [ ] **N83** — Cost optimization
  - **Visual idea:** Waterfall bar chart: Baseline cost → after model routing → after semantic caching → after prompt compression. Each bar shows the reduction % and the technique applied. Interactive: toggle each optimization on/off and watch bars update.

- [ ] **N84** — Health checks & monitoring
  - **Visual idea:** Grafana-style dashboard mockup: four panels — latency histogram (p50/p95), error rate line chart, token usage bar, daily cost line. Static SVG that looks like a real monitoring dashboard.

- [ ] **N85** — Zero-downtime deployment
  - **Visual idea:** Blue/green swap animation — two stacks (blue=old, green=new) side by side. Load balancer arrow starts pointing at blue. "Deploy" button: green stack spins up, arrow smoothly transitions to green, blue fades out.

### Backend prompt — backend/routers/day17.py

```
I'm learning AI engineering. Today is Day 17.

Fill in backend/routers/day17.py.

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

class CostRequest(BaseModel):
    monthly_requests: int
    avg_input_tokens: int
    avg_output_tokens: int

POST /ask
- System: BEGINNER_SYSTEM_PROMPT +
  "Today's topic is production deployment of AI apps: Docker multi-stage builds,
   CI/CD with GitHub Actions, cost optimization (model routing, semantic caching,
   prompt compression), health checks and monitoring, and zero-downtime deployment
   (blue/green, rolling updates, PM2 reload).
   Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}, track, return standard shape

POST /cost-estimate
- Accepts CostRequest — no LLM call, pure math
- Import RATES from token_tracker
- For each provider in RATES, calculate:
    monthly_cost = (monthly_requests * avg_input_tokens / 1_000_000 * input_rate)
                 + (monthly_requests * avg_output_tokens / 1_000_000 * output_rate)
    cost_per_request = monthly_cost / monthly_requests
- Sort by monthly_cost ascending
- Returns:
  {"estimates": [{"provider","model","monthly_cost_usd","cost_per_request_usd"}],
   "cheapest": provider_name,
   "most_expensive": provider_name,
   "savings_vs_most_expensive_pct": float,
   "inputs": {monthly_requests, avg_input_tokens, avg_output_tokens}}

Requirements: from provider import get_client, get_model, get_provider, BEGINNER_SYSTEM_PROMPT
              from token_tracker import track, RATES — no placeholder comments
```

### Frontend prompt — frontend/app/advanced-ai/day-17/page.tsx

```
I'm learning AI engineering. Today is Day 17: Production & Deployment.

Replace frontend/app/advanced-ai/day-17/page.tsx.

SECTION 1 — Ask anything (standard pattern)
- <ModelSwitcher />, text input placeholder: "How do I deploy a FastAPI app to EC2 with Docker?",
  POST /day17/ask, EN|ID cards, footer

SECTION 2 — Visual: Cost estimator
- Three number inputs (inline row):
    Monthly requests (default 10000)
    Avg input tokens/req (default 500)
    Avg output tokens/req (default 200)
- "Estimate cost" button → POST /day17/cost-estimate (no provider field needed)
- On response render:

  TOP — Summary row:
    Cheapest: [provider badge] $X.XX/mo · Most expensive: [provider badge] $X.XX/mo
    "Choosing [cheapest] saves X% vs [most_expensive]" — green highlight

  MIDDLE — Horizontal bar chart (sorted cheapest → most expensive):
    Each row: provider badge | bar (width proportional to cost) | $X.XX/mo | $0.000X/req
    Cheapest row: green bar + "Cheapest ✓" badge
    Most expensive row: red bar

  BOTTOM — Visual: Cost optimization waterfall (static, illustrative):
    Four horizontal bars stacked:
      Baseline (no optimization)         ████████████████  $X.XX
      After model routing                ████████░░░░░░░░  -40%
      After semantic caching             █████░░░░░░░░░░░  -60%
      After prompt compression           ████░░░░░░░░░░░░  -70%
    Each bar has a technique label and reduction badge.
    Static illustration — not connected to the calculator above.

SECTION 3 — Visual: Blue/green deployment animator
  Two side-by-side stacked boxes:
    LEFT: "Blue (current)" — blue border, shows v1.0
    RIGHT: "Green (new)" — green border, shows v1.1, initially faded/dashed
  Load balancer box above both, with an arrow pointing to Blue
  "Deploy" button:
    1. Green stack fades in (opacity 0→1, border solid)
    2. Arrow smoothly transitions from Blue to Green (CSS transition)
    3. Blue stack fades out and shows "Terminated"
    4. Status label: "Zero downtime ✓"
  "Reset" button restores initial state.
  Uses CSS transitions only — no animation library.

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 18 — Advanced AI Topics

**Goal:** Understand fine-tuning, RLHF, DPO, alignment, and quantization — the techniques that shaped every model in this roadmap.

### System requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Any dual-core | Quad-core+ |
| RAM | 4 GB (API mode) | 32 GB (local fine-tuning) |
| GPU | Not required (API mode) | NVIDIA 16 GB+ VRAM for QLoRA |
| CUDA | Not required (API mode) | CUDA 12.1+ for QLoRA / RLHF training |
| cuDNN | Not required | cuDNN 9.x (pairs with CUDA 12.x) |
| Storage | 200 MB (API mode) | 20 GB+ (base model + adapter weights) |
| Network | Required (API calls) | Required |
| GPU per technique | | |
| LoRA (7B model) | RTX 3060 12 GB + CUDA 12.1 | RTX 4090 24 GB + CUDA 12.4 |
| QLoRA (7B model) | RTX 3060 8 GB + CUDA 12.1 | RTX 3090 24 GB + CUDA 12.4 |
| QLoRA (13B model) | RTX 3090 24 GB + CUDA 12.1 | A100 40 GB + CUDA 12.4 |
| Full fine-tune (7B) | A100 40 GB × 2 + CUDA 12.1 | A100 80 GB × 4 + CUDA 12.4 |
| Notes | Day 18 interactive demos are API-only — no GPU needed. For actual fine-tuning: QLoRA is the most accessible (fits on RTX 3060 12 GB for 7B). Install: `pip install peft transformers bitsandbytes accelerate`. bitsandbytes requires CUDA 12.1+. Easiest option: use Kaggle (free T4 16 GB) or Colab Pro (A100). CUDA install: developer.nvidia.com/cuda-downloads. |

### Nodes

- [ ] **N86** — Fine-tuning deep dive (LoRA / QLoRA)
  - **Visual idea:** Side-by-side: Full fine-tune (all weight matrices glow, expensive) vs LoRA (only two small adapter matrices A×B inserted per layer glow, cheap). A parameter count badge shows "~1% of weights updated."

- [ ] **N87** — RLHF
  - **Visual idea:** Three-stage pipeline: Stage 1 SFT (labeled demo pairs) → Stage 2 Reward Model (human preference pairs A>B) → Stage 3 PPO (RL loop with KL penalty arrow). Each stage is a distinct colored block; click to expand with a one-paragraph explanation.

- [ ] **N88** — DPO
  - **Visual idea:** RLHF vs DPO comparison — RLHF shown as a 3-box chain (complex), DPO shown as a single training step with chosen/rejected pair input and one loss function box. A "complexity" badge: RLHF=high, DPO=medium.

- [ ] **N89** — AI alignment & safety
  - **Visual idea:** Reward hacking illustration — agent tasked with "get high score" finds a glitch (shortcut arrow bypassing the intended path). Constitutional AI flow: response → critique → revision → final. Two panels side by side.

- [ ] **N90** — Quantization & model compression
  - **Visual idea:** Precision spectrum bar: FP32 → BF16 → INT8 → INT4. Below each: model size bar and accuracy bar. An interactive slider lets user drag precision and watch both bars update. A "fits on hardware" row shows which GPU/RAM tier each fits.

### Backend prompt — backend/routers/day18.py

```
I'm learning AI engineering. Today is Day 18.

Fill in backend/routers/day18.py.

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

class ConceptRequest(BaseModel):
    concept: str   # "lora"|"rlhf"|"dpo"|"alignment"|"quantization"
    provider: str | None = None

POST /ask
- System: BEGINNER_SYSTEM_PROMPT +
  "Today's topic is advanced AI: fine-tuning with LoRA/QLoRA, RLHF, DPO,
   AI alignment and safety (Constitutional AI, reward hacking), and model quantization.
   These are genuinely complex topics — use simple analogies and be accurate.
   Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}, track, return standard shape

POST /explain-concept
- Accepts ConceptRequest
- Prompt: "Explain '{concept}' for a complete beginner. Return JSON:
  {title, one_line_en, one_line_id, analogy_en, analogy_id,
   steps:[{label, description_en, description_id}],
   complexity:'medium'|'high',
   why_it_matters_en, why_it_matters_id}"
- response_format={"type": "json_object"}, track, return parsed breakdown + metadata

Requirements: from provider import get_client, get_model, get_provider, BEGINNER_SYSTEM_PROMPT
              from token_tracker import track — no placeholder comments
```

### Frontend prompt — frontend/app/advanced-ai/day-18/page.tsx

```
I'm learning AI engineering. Today is Day 18: Advanced AI Topics.

Replace frontend/app/advanced-ai/day-18/page.tsx.

SECTION 1 — Ask anything (standard pattern)
- <ModelSwitcher />, text input placeholder: "What is the difference between RLHF and DPO?",
  POST /day18/ask, EN|ID cards, footer

SECTION 2 — Visual: Concept deep-dive
- Five concept toggle pills: LoRA / QLoRA | RLHF | DPO | Alignment | Quantization
- <ModelSwitcher /> + "Explain this concept" → POST /day18/explain-concept

- On response:
  TOP — Complexity badge (medium=amber, high=red) + one-line summary (EN|ID toggle)

  ANALOGY CARD — highlighted box (different bg color), shows analogy_en | analogy_id

  STEPS — numbered step list: label (bold) + description (EN|ID toggle)
    Animate steps fading in one by one with 100ms stagger

  WHY IT MATTERS — bottom card with why_it_matters_en | why_it_matters_id

SECTION 3 — Visual: LoRA vs Full fine-tune (always visible)
  Side-by-side diagram (SVG or divs):
    LEFT "Full fine-tune":
      Stack of 6 horizontal bars (transformer layers), all glowing blue
      Label: "All weights update — expensive"
      Badge: "100% parameters"

    RIGHT "LoRA":
      Same stack, layers are gray (frozen)
      Two small colored boxes overlaid on each layer: "A" and "B" (adapter matrices)
      Only A and B boxes glow
      Label: "Only adapters update — cheap"
      Badge: "~1% parameters"

  A "parameter count" counter animates from 7,000,000,000 down to 70,000,000 when
  toggling from Full to LoRA view.

SECTION 4 — Visual: Quantization precision explorer (always visible)
  Four precision columns: FP32 | BF16 | INT8 | INT4
  Each column shows:
    Precision label (bold)
    Model size bar (FP32=100%, BF16=50%, INT8=25%, INT4=12.5%)
    Quality bar (FP32=100%, BF16=99%, INT8=96%, INT4=88%)
    RAM needed badge: (FP32=28GB, BF16=14GB, INT8=7GB, INT4=3.5GB) for a 7B model
    Fits on: device badges (CPU / 8GB GPU / 16GB GPU)
  Clicking a column highlights it and shows a tooltip: "Used by: [GGUF/vLLM/etc]"

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 19 — AI Business & Products

**Goal:** Understand AI pricing models, GTM strategy, the demo trap, responsible AI, and real-world case studies.

### System requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Any dual-core | Any |
| RAM | 4 GB | 4 GB |
| GPU | Not required | Not required |
| Storage | 200 MB | 200 MB |
| Network | Required (API calls) | Required |
| Notes | Pure concept + API day. No special hardware. The product critique demo makes one LLM API call per submission. |

### Nodes

- [ ] **N91** — AI product pricing models
  - **Visual idea:** 2×2 matrix: X axis = cost predictability (variable → fixed), Y axis = value alignment (low → high). Four pricing model bubbles placed in their quadrant: per-token (bottom-left), per-seat (top-left), usage tiers (bottom-right), outcome-based (top-right).

- [ ] **N92** — GTM for AI products
  - **Visual idea:** Three GTM motion cards (PLG / API-first / Vertical SaaS) each showing an adoption curve shape — PLG is exponential bottom-up, API-first is step-function developer adoption, Vertical SaaS is slow-then-steep enterprise. Click each to expand with examples.

- [ ] **N93** — The demo trap
  - **Visual idea:** Split-screen: "Demo environment" (clean, fast, cheap, curated input) vs "Production reality" (messy input, tail latency spike, cost overrun, hallucination). Each side is a card with a list of differences color-coded green/red.

- [ ] **N94** — Building with AI APIs responsibly
  - **Visual idea:** Checklist card with 6 items grouped by category: Transparency (2 items) / Safety (2 items) / User control (2 items). Each item has a checkbox (decorative), a title, and a one-sentence description. Items appear with a stagger animation on load.

- [ ] **N95** — AI product case studies
  - **Visual idea:** Five product cards in a row: Cursor / Harvey / Perplexity / ElevenLabs / Glean. Each card: product name, one-line description, GTM motion badge, pricing model badge. Click a card to flip it (CSS 3D flip) and show the "why it worked" lesson on the back.

### Backend prompt — backend/routers/day19.py

```
I'm learning AI engineering. Today is Day 19.

Fill in backend/routers/day19.py.

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

class IdeaRequest(BaseModel):
    idea: str
    provider: str | None = None

POST /ask
- System: BEGINNER_SYSTEM_PROMPT +
  "Today's topic is AI products and business: pricing models (per-token, per-seat,
   usage tiers, outcome-based), GTM strategy (PLG, API-first, vertical SaaS),
   the demo trap, responsible AI practices, and case studies
   (Cursor, Harvey, Perplexity, ElevenLabs, Glean).
   Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}, track, return standard shape

POST /product-critique
- Accepts IdeaRequest
- Prompt: "You are a tough but fair AI product critic. Critique this idea: '{idea}'
   Reply as JSON:
   {demo_trap_en, demo_trap_id,
    pricing_model, pricing_reason_en, pricing_reason_id,
    gtm_motion:'PLG'|'API-first'|'Vertical SaaS',
    gtm_reason_en, gtm_reason_id,
    safety_concern_en, safety_concern_id,
    viability_score: 1-10,
    viability_reason_en, viability_reason_id}"
- response_format={"type": "json_object"}, track, return parsed critique + metadata

Requirements: from provider import get_client, get_model, get_provider, BEGINNER_SYSTEM_PROMPT
              from token_tracker import track — no placeholder comments
```

### Frontend prompt — frontend/app/advanced-ai/day-19/page.tsx

```
I'm learning AI engineering. Today is Day 19: AI Business & Products.

Replace frontend/app/advanced-ai/day-19/page.tsx.

SECTION 1 — Ask anything (standard pattern)
- <ModelSwitcher />, text input placeholder: "How does Cursor's GTM strategy work?",
  POST /day19/ask, EN|ID cards, footer

SECTION 2 — Visual: Product idea critique
- Textarea: "Describe your AI product idea in one sentence"
  placeholder: "An AI that reads your emails and drafts replies automatically"
- <ModelSwitcher /> + "Critique this idea" → POST /day19/product-critique

- On response:
  TOP — Viability score: large number (1–10) with color (1–4=red, 5–7=amber, 8–10=green)
    + viability_reason in EN|ID toggle

  MIDDLE — 2×2 critique grid:
    🎭 Demo trap risk   |  💰 Pricing model
    🚀 GTM motion       |  🛡️ Safety concern
    Each cell: icon + label (bold) + EN|ID toggle content
    GTM cell: shows motion badge (PLG=blue, API-first=purple, Vertical SaaS=teal)
    Pricing cell: shows model badge

SECTION 3 — Visual: Case study card flip gallery (always visible)
  Five cards in a responsive row: Cursor | Harvey | Perplexity | ElevenLabs | Glean
  Front of each card: product name (large) + one-line description + two badges (GTM + pricing)
  Back of each card (CSS 3D flip on click):
    "Why it worked:" + one paragraph lesson
    "Key metric:" + one impressive number (e.g. "$200M ARR in 2 years")
  Cards flip individually on click. Clicked card shows a ring highlight.
  Static data — hardcoded, no API call.

SECTION 4 — Visual: Pricing model 2×2 matrix (always visible)
  SVG or div-based 2×2 grid:
    X axis label: "Cost predictability →" (variable to fixed)
    Y axis label: "Value alignment →" (low to high)
    Four quadrant bubbles:
      Per-token (bottom-left, gray)
      Per-seat (top-left, blue)
      Usage tiers (bottom-right, teal)
      Outcome-based (top-right, green — the ideal)
    Each bubble: pricing model name + one-line example
    Clicking a bubble highlights it and shows a tooltip with pros/cons

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no placeholder comments
```

---

## Day 20 — Capstone: Build Your AI App

**Goal:** Apply every concept from Day 01–19. Choose your stack, pick your architecture, build a RAG app end-to-end, eval it, and ship it.

### System requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Quad-core | 8-core+ |
| RAM | 8 GB | 16 GB |
| GPU | Not required (cloud RAG) | NVIDIA 8 GB (if local inference capstone) |
| Storage | 2 GB | 5 GB |
| Network | Required | Required |
| Other | PostgreSQL + pgvector installed | Docker for easier setup |
| Notes | The capstone RAG app uses cloud LLM APIs + Qdrant (in-memory or local). PostgreSQL + pgvector needed if extending to persistent storage. For a fully local capstone (Ollama + local Qdrant): 16 GB RAM + 8 GB VRAM recommended. |

### Nodes

- [ ] **N96** — Choosing your stack
  - **Visual idea:** Interactive decision tree — 5 yes/no questions (needs multimodal? needs own docs? needs agents? needs local? needs scale?) branch into a recommended stack. Each path is a colored line; the final recommendation glows.

- [ ] **N97** — Architecture patterns
  - **Visual idea:** Three architecture diagrams side by side — Simple (user → LLM → output, 3 boxes), RAG (user → embed → retrieve → LLM+context → output, 5 boxes), Agent (user → agent → tool loop → output, cyclic). Each is a mini-flowchart that animates on hover.

- [ ] **N98** — Build a RAG app end-to-end
  - **Visual idea:** Full system diagram — PDF upload → chunker → embedder → Qdrant → retriever → prompt builder → LLM → streaming response → UI. Each component is a labeled box; a dot animates through the pipeline when "Run demo" is clicked.

- [ ] **N99** — Eval, iterate, improve
  - **Visual idea:** Flywheel diagram — circular flow: Log → Tag → Dataset → Eval → Ship → back to Log. Each stage is an arc segment with a one-line action. An animated dot rotates around the flywheel. Clicking a segment shows a tool example (Langfuse / LangSmith / RAGAS).

- [ ] **N100** — What comes next
  - **Visual idea:** Constellation map — all 100 nodes (N01–N100) as dots arranged by category, connected by thin lines within each group. Categories color-coded: teal=foundations, coral=retrieval, purple=agents, amber=infra, blue=advanced. Hovering a dot shows the node name and day.

### Backend prompt — backend/routers/day20.py

```
I'm learning AI engineering. Today is Day 20.

Fill in backend/routers/day20.py.

class AskRequest(BaseModel):
    question: str
    provider: str | None = None

class StackRequest(BaseModel):
    needs_multimodal: bool
    needs_own_docs: bool
    needs_agents: bool
    needs_local: bool
    needs_scale: bool
    provider: str | None = None

POST /ask
- System: BEGINNER_SYSTEM_PROMPT +
  "Today is the capstone day — the learner has completed Days 1–19 covering
   tokens, embeddings, prompting, RAG, agents, MCP, multimodal, vector DBs,
   ML frameworks, cloud platforms, local inference, observability, LLM frameworks,
   production deployment, advanced AI, and AI business.
   Be encouraging and forward-looking. Help them plan their first real project.
   Reply only as JSON: {answer_en, answer_id}. No markdown."
- response_format={"type": "json_object"}, track, return standard shape

POST /stack-picker
- Accepts StackRequest
- Prompt: "Given these requirements: multimodal={needs_multimodal}, own_docs={needs_own_docs},
   agents={needs_agents}, local={needs_local}, scale={needs_scale},
   recommend the best stack. Reply as JSON:
   {architecture:'simple'|'rag'|'agent',
    frontend:str, backend:str, vector_db:str|null,
    llm_provider:str, local_runtime:str|null,
    reason_en:str, reason_id:str,
    days_to_revisit:[int],
    estimated_complexity:'weekend'|'1-week'|'1-month'}"
- response_format={"type": "json_object"}, track, return parsed recommendation + metadata

Requirements: from provider import get_client, get_model, get_provider, BEGINNER_SYSTEM_PROMPT
              from token_tracker import track — no placeholder comments
```

### Frontend prompt — frontend/app/advanced-ai/day-20/page.tsx

```
I'm learning AI engineering. Today is Day 20: Capstone.

Replace frontend/app/advanced-ai/day-20/page.tsx.

SECTION 1 — Ask anything (capstone Q&A)
- <ModelSwitcher />, text input placeholder: "What should I build first after finishing this roadmap?",
  POST /day20/ask, EN|ID cards, footer

SECTION 2 — Visual: Stack picker + decision tree
- Five toggle switches with icons (off by default):
    📷 Needs multimodal    📄 Needs my own docs
    🤖 Needs agents        🏠 Needs to run locally   📈 Needs to scale
- <ModelSwitcher /> + "Pick my stack" → POST /day20/stack-picker

- On response:
  TOP — Architecture badge (simple/rag/agent, large colored pill)
    + complexity estimate badge (weekend=green, 1-week=amber, 1-month=red)

  MIDDLE — Stack table (two columns: Component | Recommended):
    Frontend | Backend | Vector DB | LLM Provider | Local Runtime
    Each value is a colored technology badge

  Reason: EN | ID toggle paragraph

  "Revisit these days" — pill badges (e.g. Day 7, Day 8) that link to /day-07, /day-08

SECTION 3 — Visual: Architecture pattern selector (always visible)
  Three mini-diagrams in a row (Simple / RAG / Agent):
    Each is an SVG flowchart, 3–5 nodes, labeled
    Clicking one highlights it with a ring and shows:
      Use case examples (bullet list)
      Trade-off: cost / complexity / capability

  The architecture matching the stack-picker result auto-highlights.

SECTION 4 — Visual: 100-node constellation map (always visible)
  SVG canvas showing all 100 nodes as small circles grouped by category:
    teal = foundations (Day 1–4, N1–N20)
    coral = retrieval (Day 5–8, N21–N40)
    purple = agents (Day 9–10 + 16, N41–N50 + N76–N80)
    amber = infra (Day 11–14 + 17, N51–N70 + N81–N85)
    blue = advanced (Day 15 + 18–20, N71–N75 + N86–N100)
  Nodes connected by thin lines within each group.
  Hover a node: tooltip shows node ID + name.
  All nodes start gray and "light up" in sequence (stagger animation on mount),
  ending with a brief white flash on N100 and the label "100 / 100".

SECTION 5 — Completion banner (pinned at bottom)
  Full-width banner, celebratory but clean:
    "100 / 100 nodes complete"
    Tagline: "Tokens, embeddings, prompts, models, vector DBs, RAG, agents, MCP,
    multimodal. You built every one. Go ship something."
  Links row:
    HuggingFace Hub · OpenClaw (https://github.com/openclaw/openclaw) ·
    Anthropic Research · Simon Willison's Blog

Requirements: Next.js 14 App Router + TypeScript + Tailwind — no external chart library — no placeholder comments
```

---

## Progress tracker (full roadmap)

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
| 11 | Vector DB landscape | ☐ | ☐ |
| 12 | ML frameworks | ☐ | ☐ |
| 13 | Cloud AI platforms | ☐ | ☐ |
| 14 | Local model inference | ☐ | ☐ |
| 15 | Observability & evals | ☐ | ☐ |
| 16 | LLM frameworks | ☐ | ☐ |
| 17 | Production & deployment | ☐ | ☐ |
| 18 | Advanced AI topics | ☐ | ☐ |
| 19 | AI business & products | ☐ | ☐ |
| 20 | Capstone — build your AI app | ☐ | ☐ |

**Total: 100 nodes across 20 days. Roadmap complete.**
