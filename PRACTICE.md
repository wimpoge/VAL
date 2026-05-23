# VAL — Practice Guide
> Hands-on experiments for each day · Manual setup · No Claude Code needed

This guide is for learners who cloned the VAL repository and want to practice
the tools covered in each day **outside the VAL app itself**.

> ⚠️ The VAL app (browser) works without any of this.
> This guide is **100% optional** — only follow it if you want to run the tools yourself locally.

---

## Before you start — what you need

| Requirement | Details |
|-------------|---------|
| Python | 3.11+ → python.org/downloads |
| Git | Already installed if you cloned this repo |
| Terminal | Terminal (Mac/Linux) or PowerShell (Windows) |
| Internet | Required for package downloads |
| GPU | Optional — see per-day requirements below |

Check your Python version:
```bash
python --version   # should say 3.11.x or higher
```

---

## What is a virtual environment (venv)?

When you install Python packages globally, different projects conflict with each other.
Think of it like this:

> 🏠 Global Python = shared apartment. Everyone's stuff gets mixed up.
> 🚪 venv = your own room. Your packages stay isolated.

**One venv at the project root** — this is the standard industry approach:
- One isolated environment covers all practice days
- No need to activate/deactivate every time you switch days
- Your experiments never get pushed to GitHub (gitignored)
- Easy to wipe and recreate without touching the VAL app or backend

---

## One-time setup (run this once after cloning)

```bash
# 1. Go to the project root
cd ai-engineer-roadmap

# 2. Create ONE venv for all practice days
python -m venv .venv

# 3. Activate it
source .venv/bin/activate          # Mac / Linux
.venv\Scripts\activate             # Windows PowerShell

# You should see (.venv) at the start of your terminal prompt

# 4. Upgrade pip
pip install --upgrade pip

# 5. Install practice frontend deps (one time)
cd practice/frontend
npm install
cd ../..
```

After this one-time setup, every time you open a new terminal:
```bash
cd ai-engineer-roadmap
source .venv/bin/activate     # Mac / Linux
.venv\Scripts\activate        # Windows
```

---

## How to start practicing any day

You need **two terminals** — one for backend, one for frontend.

```bash
# Terminal 1 — Practice backend (FastAPI, port 8001)
source .venv/bin/activate
pip install -r practice/day-14/backend/requirements.txt   # change 14 to your day
cd practice/day-14/backend
uvicorn main:app --reload --port 8001
```

```bash
# Terminal 2 — Practice frontend (Next.js, port 3001)
cd practice/frontend
npm run dev -- --port 3001
```

Then open **http://localhost:3001/day-14** in your browser.

> ⚠️ Never use port 3000 or 8000 — those are reserved for the VAL app.

| Port | What runs here |
|------|----------------|
| 3000 | VAL app frontend (do not touch) |
| 8000 | VAL app backend (do not touch) |
| 3001 | Practice frontend |
| 8001 | Practice backend |
| 11434 | Ollama local server (Day 14) |

---

## Day-by-day practice guide

---

### Day 11 — Vector DB Landscape
**What you'll practice:** FAISS, ChromaDB, Qdrant, Weaviate, Pinecone

**Requirements:** Any laptop · No GPU · ~500 MB disk

```bash
pip install -r practice/day-11/backend/requirements.txt
cd practice/day-11
```

**Common errors & fixes:**

| Error | Fix |
|-------|-----|
| `faiss-cpu` fails on Windows | `pip install faiss-cpu --prefer-binary` |
| `qdrant-client` SSL error | `pip install qdrant-client --trusted-host pypi.org` |
| `weaviate-client` import error | `pip install weaviate-client==4.6.0` |

**Try it — ChromaDB in 10 lines:**
```python
# practice/day-11/main.py
import chromadb

client = chromadb.Client()
col = client.create_collection("my_docs")
col.add(
    documents=["AI is cool", "Python is great", "RAG is powerful"],
    ids=["1", "2", "3"]
)
results = col.query(query_texts=["machine learning"], n_results=2)
print(results)
```
```bash
python main.py
```

---

### Day 12 — ML Frameworks
**What you'll practice:** PyTorch, HuggingFace Transformers, ONNX

**Requirements:** 8 GB RAM · GPU optional (CUDA 11.8+ if GPU) · ~2 GB disk

```bash
pip install -r practice/day-12/backend/requirements.txt
cd practice/day-12
```

**If PyTorch install fails:**
```bash
# CPU only — always works
pip install torch --index-url https://download.pytorch.org/whl/cpu

# With CUDA 12.1 GPU support
pip install torch --index-url https://download.pytorch.org/whl/cu121
```

**Common errors & fixes:**

| Error | Fix |
|-------|-----|
| `torch` install times out | Use CPU index URL above |
| `transformers` model download slow | Set `HF_HUB_OFFLINE=1` after first download |
| `onnxruntime` error on Mac M1/M2 | `pip install onnxruntime-silicon` instead |

**Try it — HuggingFace pipeline:**
```python
# practice/day-12/main.py
from transformers import pipeline

classifier = pipeline("sentiment-analysis")
result = classifier("I love building AI apps!")
print(result)  # [{'label': 'POSITIVE', 'score': 0.9998}]
```
```bash
python main.py
```

---

### Day 13 — Cloud AI Platforms
**What you'll practice:** DashScope (Alibaba), GCP Vertex, AWS Bedrock SDK

**Requirements:** Any laptop · No GPU · Cloud account per platform · ~200 MB disk

```bash
pip install -r practice/day-13/backend/requirements.txt
cd practice/day-13
```

**Account setup links (free tiers):**
- GCP Vertex AI (Gemini free): console.cloud.google.com/vertex-ai
- Alibaba DashScope (free trial): dashscope.aliyun.com
- Kaggle notebooks (free T4 GPU): kaggle.com/code
- Google Colab (free T4): colab.research.google.com

**Common errors & fixes:**

| Error | Fix |
|-------|-----|
| `boto3` NoCredentialsError | Run `aws configure` or set `AWS_ACCESS_KEY_ID` env var |
| GCP AuthError | Run `gcloud auth application-default login` |
| DashScope ImportError | `pip install dashscope --upgrade` |

**Try it — DashScope (cheapest, OpenAI-compatible):**
```python
# practice/day-13/main.py
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["DASHSCOPE_API_KEY"],
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)
response = client.chat.completions.create(
    model="qwen-turbo",
    messages=[{"role": "user", "content": "What is RAG in AI?"}]
)
print(response.choices[0].message.content)
```
```bash
export DASHSCOPE_API_KEY=your_key_here
python main.py
```

---

### Day 14 — Local Model Inference
**What you'll practice:** Ollama, llama.cpp

**Requirements:** 8 GB RAM (CPU) · 8 GB VRAM (GPU) · 4 GB disk per model

```bash
pip install -r practice/day-14/backend/requirements.txt
cd practice/day-14
```

**Install Ollama first (separate from pip):**
```bash
# Mac / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows — download installer from:
# ollama.com/download/windows
```

**Run your first local model:**
```bash
# Smallest model — ~2 GB
ollama run llama3.2:3b

# Good multilingual (Indonesian support)
ollama run qwen2.5:3b
```

**Common errors & fixes:**

| Error | Fix |
|-------|-----|
| `ollama: command not found` | Restart terminal after install |
| Out of memory | Use smaller model: `ollama run tinyllama` (~600 MB) |
| `llama-cpp-python` install fails | `pip install llama-cpp-python --prefer-binary` |
| vLLM on Windows | vLLM is Linux-only — use WSL2 or use Ollama instead |
| CUDA not detected | Install NVIDIA CUDA Toolkit 12.1+: developer.nvidia.com/cuda-downloads |

**Try it — Ollama Python API:**
```python
# practice/day-14/main.py
import ollama

response = ollama.chat(
    model="llama3.2:3b",
    messages=[{"role": "user", "content": "Explain embeddings simply."}]
)
print(response["message"]["content"])
```
```bash
# Start ollama server first
ollama serve &
python main.py
```

---

### Day 15 — Observability & Evals
**What you'll practice:** Langfuse, RAGAS scoring

**Requirements:** Any laptop · No GPU · ~300 MB disk · OpenAI API key

```bash
pip install -r practice/day-15/backend/requirements.txt
cd practice/day-15
```

**Common errors & fixes:**

| Error | Fix |
|-------|-----|
| `langfuse` connection error | Set `LANGFUSE_HOST=https://cloud.langfuse.com` |
| `ragas` import fails | `pip install ragas==0.1.14` |
| OpenAI key not found | `export OPENAI_API_KEY=sk-...` |

**Try it — RAGAS scorer:**
```python
# practice/day-15/main.py
from ragas.metrics import faithfulness, answer_relevancy
from ragas import evaluate
from datasets import Dataset

data = {
    "question": ["What is RAG?"],
    "answer": ["RAG stands for Retrieval-Augmented Generation."],
    "contexts": [["RAG is a technique that retrieves documents before generating."]],
    "ground_truth": ["RAG is Retrieval-Augmented Generation."]
}
result = evaluate(Dataset.from_dict(data), metrics=[faithfulness, answer_relevancy])
print(result)
```
```bash
export OPENAI_API_KEY=sk-...
python main.py
```

---

### Day 16 — LLM Frameworks
**What you'll practice:** LangChain LCEL, LangGraph, CrewAI

**Requirements:** Any laptop · No GPU · ~500 MB disk · OpenAI/Groq API key

```bash
pip install -r practice/day-16/backend/requirements.txt
cd practice/day-16
```

**Common errors & fixes:**

| Error | Fix |
|-------|-----|
| `langchain` version conflict | `pip install langchain==0.2.0 langchain-openai==0.1.0` |
| `crewai` install slow | Normal — many deps, wait ~3 min |
| `langgraph` StateGraph error | `pip install langgraph --upgrade` |

**Try it — LangChain LCEL:**
```python
# practice/day-16/main.py
import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

chain = (
    ChatPromptTemplate.from_template("Explain {topic} in one sentence.")
    | ChatOpenAI(model="gpt-4o-mini")
    | StrOutputParser()
)
print(chain.invoke({"topic": "vector databases"}))
```
```bash
export OPENAI_API_KEY=sk-...
python main.py
```

---

### Day 17 — Production & Deployment
**What you'll practice:** Docker build, health checks

**Requirements:** Any laptop · Docker Desktop installed · No GPU · ~1 GB disk

```bash
# Install Docker Desktop first: docker.com/products/docker-desktop
docker --version   # verify install

pip install -r practice/day-17/backend/requirements.txt
cd practice/day-17
```

**Common errors & fixes:**

| Error | Fix |
|-------|-----|
| `docker: command not found` | Install Docker Desktop and restart terminal |
| Docker build OOM | Increase memory in Docker Desktop → Resources |
| Port already in use | `lsof -i :8000` then `kill -9 <PID>` |

**Try it — Dockerize a simple FastAPI app:**
```python
# practice/day-17/main.py
from fastapi import FastAPI
app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}
```
```dockerfile
# practice/day-17/Dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN pip install fastapi uvicorn
COPY main.py .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
```bash
docker build -t my-ai-app .
docker run -p 8000:8000 my-ai-app
# Open http://localhost:8000/health
```

---

### Day 18 — Fine-tuning (LoRA / QLoRA)
**What you'll practice:** QLoRA fine-tuning with peft + bitsandbytes

**Requirements:** 12 GB VRAM (RTX 3060+) · CUDA 12.1+ · 16 GB RAM · ~10 GB disk
**No GPU?** → Use Kaggle free T4: kaggle.com/code (30 hrs/week free)

```bash
pip install -r practice/day-18/backend/requirements.txt
cd practice/day-18
```

**Verify CUDA before installing:**
```bash
nvidia-smi        # check GPU + driver version
nvcc --version    # check CUDA toolkit (need 12.1+)
```

**Install CUDA 12.1 if missing:**
- developer.nvidia.com/cuda-downloads → select your OS → CUDA 12.1

**Common errors & fixes:**

| Error | Fix |
|-------|-----|
| `bitsandbytes` CUDA error | Must have CUDA 12.1+ installed system-wide |
| `bitsandbytes` on Windows | Use WSL2 — bitsandbytes is Linux-only natively |
| OOM during QLoRA | Reduce `per_device_train_batch_size=1`, `max_seq_length=256` |
| `peft` version mismatch | `pip install peft==0.12.0 transformers==4.44.0` |
| No GPU | Use Kaggle free T4 instead (see below) |

**No GPU? Use Kaggle:**
1. kaggle.com/code → New Notebook
2. Settings → Accelerator → GPU T4 x2
3. Copy practice script → Run (free, no setup)

**Try it — check your setup:**
```python
# practice/day-18/main.py
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
else:
    print("No GPU — use Kaggle free T4 for fine-tuning")
```
```bash
python main.py
```

---

### Day 19 — AI Business & Products
**What you'll practice:** Cost calculations, product critique scripts

**Requirements:** Any laptop · No GPU · ~200 MB disk

```bash
pip install -r practice/day-19/backend/requirements.txt
cd practice/day-19
```

**Try it — cost calculator:**
```python
# practice/day-19/main.py
RATES = {
    "gpt-4o-mini":   {"input": 0.15,  "output": 0.60},
    "groq-llama3":   {"input": 0.05,  "output": 0.08},
    "deepseek-chat": {"input": 0.27,  "output": 1.10},
    "gemini-flash":  {"input": 0.10,  "output": 0.40},
}

monthly_requests = 10_000
avg_input, avg_output = 500, 200

print(f"{'Model':<20} {'Monthly':>12} {'Per request':>13}")
print("-" * 47)
for model, r in sorted(RATES.items(), key=lambda x: x[1]["input"]):
    cost = (monthly_requests * avg_input / 1_000_000 * r["input"]) + \
           (monthly_requests * avg_output / 1_000_000 * r["output"])
    print(f"{model:<20} ${cost:>11.4f} ${cost/monthly_requests:>12.6f}")
```
```bash
python main.py
```

---

### Day 20 — Capstone
**What you'll practice:** Minimal RAG app from scratch

**Requirements:** 8 GB RAM · No GPU · ~1 GB disk · OpenAI API key

```bash
pip install -r practice/day-20/backend/requirements.txt
cd practice/day-20
```

**Try it — minimal RAG in 40 lines:**
```python
# practice/day-20/main.py
import os
from openai import OpenAI
import chromadb

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
db = chromadb.Client()
col = db.create_collection("knowledge")

docs = [
    "RAG stands for Retrieval-Augmented Generation.",
    "Embeddings are numerical representations of text.",
    "Vector databases store and search embeddings efficiently.",
]
col.add(documents=docs, ids=["1", "2", "3"])
print(f"Ingested {len(docs)} documents")

question = "What is RAG?"
results = col.query(query_texts=[question], n_results=2)
context = "\n".join(results["documents"][0])

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": f"Answer using only this context:\n{context}"},
        {"role": "user", "content": question}
    ]
)
print(f"\nQ: {question}")
print(f"A: {response.choices[0].message.content}")
```
```bash
export OPENAI_API_KEY=sk-...
python main.py
```

---

## General troubleshooting

### pip install fails
```bash
pip install --upgrade pip
pip install -r practice/day-XX/requirements.txt
```

### Wrong Python version
```bash
python --version    # check
python3 -m venv .venv    # use python3 explicitly if needed
```

### venv not activating on Windows
```bash
# Run once in PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then activate normally
.venv\Scripts\activate
```

### Package version conflict
```bash
# Wipe and reinstall the venv
deactivate
rm -rf .venv                  # Mac/Linux
rd /s /q .venv                # Windows
python -m venv .venv
source .venv/bin/activate
pip install -r practice/day-XX/requirements.txt
```

### After fixing a bug in VAL backend/frontend
```bash
# Restart backend
cd ai-engineer-roadmap/backend
uvicorn main:app --reload --port 8000

# Restart VAL frontend (port 3000)
cd ai-engineer-roadmap/frontend
npm run dev

# Practice frontend if any (port 3001 — NOT 3000)
npm run dev -- --port 3001
```

---

## Port reference

| Port | What runs here |
|------|----------------|
| 3000 | VAL app (Next.js) — do not use for practice |
| 3001 | Practice frontend experiments |
| 8000 | VAL backend (FastAPI) |
| 11434 | Ollama local model server |

---

## Still stuck?

1. Read the error carefully — it usually says exactly what's missing
2. Google the exact error + your Python version
3. Check `practice/day-XX/requirements.txt` — maybe a version is outdated
4. For GPU days (Day 18) → use Kaggle free T4 as fallback
5. Open an issue at the VAL GitHub repo
