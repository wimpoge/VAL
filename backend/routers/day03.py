import ast
import json
import operator as op
import random
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from provider import get_client, get_model, get_provider
from token_tracker import track

router = APIRouter()


# ───────────────────────────────────────────────────────────────────
# N12 — Zero-shot vs Few-shot classify
# ───────────────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    review: str
    technique: str  # "zero_shot" | "few_shot"
    provider: str | None = None


_ZERO_SHOT_SYSTEM = (
    "You classify product reviews by sentiment. "
    "Reply only as JSON with keys: "
    'sentiment ("positive" | "negative" | "neutral"), '
    "confidence (number between 0 and 1), "
    "reasoning (one short sentence). "
    "No markdown. No extra keys."
)

_FEW_SHOT_SYSTEM = (
    _ZERO_SHOT_SYSTEM
    + "\n\nExamples:\n"
    'Review: "I love this! Best purchase I have ever made."\n'
    '→ {"sentiment": "positive", "confidence": 0.95, '
    '"reasoning": "Strong praise and superlative wording."}\n\n'
    'Review: "Total waste of money. Broke after two days."\n'
    '→ {"sentiment": "negative", "confidence": 0.92, '
    '"reasoning": "Explicit complaint about quality and value."}\n\n'
    'Review: "It works as described. Nothing special, nothing terrible."\n'
    '→ {"sentiment": "neutral", "confidence": 0.85, '
    '"reasoning": "Functional but unenthusiastic, balanced tone."}\n'
)


@router.post("/classify")
def classify(req: ClassifyRequest):
    if req.technique not in ("zero_shot", "few_shot"):
        raise HTTPException(
            status_code=400,
            detail="technique must be 'zero_shot' or 'few_shot'",
        )

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    system = _FEW_SHOT_SYSTEM if req.technique == "few_shot" else _ZERO_SHOT_SYSTEM

    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": f"Review: {req.review}"},
            ],
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"{prov} call failed: {type(e).__name__}: {e}",
        )

    content = completion.choices[0].message.content or "{}"
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        parsed = {}

    usage = completion.usage
    prompt_tokens = usage.prompt_tokens if usage else 0
    completion_tokens = usage.completion_tokens if usage else 0

    track(
        day="day03",
        endpoint="/classify",
        provider=prov,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )

    sentiment = parsed.get("sentiment", "neutral")
    if sentiment not in ("positive", "negative", "neutral"):
        sentiment = "neutral"

    try:
        confidence = float(parsed.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0

    return {
        "technique": req.technique,
        "sentiment": sentiment,
        "confidence": max(0.0, min(1.0, confidence)),
        "reasoning": str(parsed.get("reasoning", "")),
        "prompt_used": system,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# N13 — Chain of Thought
# ───────────────────────────────────────────────────────────────────

class CoTRequest(BaseModel):
    question: str
    technique: str  # "direct" | "cot"
    provider: str | None = None


_DIRECT_SYSTEM = (
    "Answer the question directly and concisely. "
    "Reply only as JSON with one key: answer (string). "
    "Do not show any reasoning. No markdown. No extra keys."
)

_COT_SYSTEM = (
    "Solve the problem by thinking step by step. Show your reasoning explicitly. "
    "Reply only as JSON with two keys: "
    "steps (array of 3 to 6 short strings, one thought per step), "
    "answer (string — the final answer only, no reasoning). "
    "No markdown. No extra keys."
)


@router.post("/cot")
def cot(req: CoTRequest):
    if req.technique not in ("direct", "cot"):
        raise HTTPException(
            status_code=400,
            detail="technique must be 'direct' or 'cot'",
        )

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    system = _COT_SYSTEM if req.technique == "cot" else _DIRECT_SYSTEM

    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
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

    content = completion.choices[0].message.content or "{}"
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        parsed = {}

    usage = completion.usage
    prompt_tokens = usage.prompt_tokens if usage else 0
    completion_tokens = usage.completion_tokens if usage else 0

    track(
        day="day03",
        endpoint="/cot",
        provider=prov,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )

    raw_steps = parsed.get("steps") if req.technique == "cot" else None
    steps: list[str] | None = None
    if isinstance(raw_steps, list):
        steps = [str(s) for s in raw_steps if isinstance(s, (str, int, float))]
        if not steps:
            steps = None

    return {
        "technique": req.technique,
        "answer": str(parsed.get("answer", "")),
        "steps": steps,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# N14 — Function Calling (agent loop)
# ───────────────────────────────────────────────────────────────────

_SAFE_OPS = {
    ast.Add: op.add,
    ast.Sub: op.sub,
    ast.Mult: op.mul,
    ast.Div: op.truediv,
    ast.Pow: op.pow,
    ast.Mod: op.mod,
    ast.USub: op.neg,
    ast.UAdd: op.pos,
}


def _safe_arith(node) -> float:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.BinOp) and type(node.op) in _SAFE_OPS:
        return _SAFE_OPS[type(node.op)](
            _safe_arith(node.left), _safe_arith(node.right)
        )
    if isinstance(node, ast.UnaryOp) and type(node.op) in _SAFE_OPS:
        return _SAFE_OPS[type(node.op)](_safe_arith(node.operand))
    raise ValueError("Only numbers and + - * / ** % allowed")


def _calculator(expression: str) -> dict:
    try:
        result = _safe_arith(ast.parse(expression, mode="eval").body)
        return {"expression": expression, "result": result}
    except Exception as e:
        return {"expression": expression, "error": f"{type(e).__name__}: {e}"}


def _get_weather(city: str) -> dict:
    rnd = random.Random(city.lower())
    return {
        "city": city,
        "temp_c": round(18 + rnd.random() * 14, 1),
        "conditions": rnd.choice(
            ["sunny", "partly cloudy", "rainy", "overcast", "windy"]
        ),
        "humidity_pct": rnd.randint(40, 85),
    }


def _web_search(query: str) -> dict:
    return {
        "query": query,
        "results": [
            {
                "title": f"Top result about {query}",
                "snippet": (
                    f"This is the most relevant snippet about {query}, "
                    "summarizing the key facts."
                ),
            },
            {
                "title": f"Wikipedia: {query}",
                "snippet": (
                    f"{query} is a topic in modern computing, with origins in "
                    "early research and recent advances."
                ),
            },
        ],
    }


_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": (
                "Evaluate a simple arithmetic expression. Use for any math question."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": (
                            "Arithmetic expression with numbers and + - * / ** ( )"
                        ),
                    }
                },
                "required": ["expression"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "City name, e.g. 'Jakarta'",
                    }
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": (
                "Search the web for general information about a topic. "
                "Use when the question asks for facts you may not know."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "What to search for",
                    }
                },
                "required": ["query"],
            },
        },
    },
]


_TOOL_DISPATCH = {
    "calculator": lambda args: _calculator(args.get("expression", "")),
    "get_weather": lambda args: _get_weather(args.get("city", "")),
    "web_search": lambda args: _web_search(args.get("query", "")),
}


class AgentRequest(BaseModel):
    question: str
    provider: str | None = None


def _safe_json(s: str | None) -> dict:
    if not s:
        return {}
    try:
        v = json.loads(s)
        return v if isinstance(v, dict) else {}
    except Exception:
        return {}


@router.post("/agent")
def agent(req: AgentRequest):
    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    messages: list[dict] = [
        {
            "role": "system",
            "content": (
                "You are a helpful assistant. Use the provided tools when they help. "
                "Always call tools for math, weather, or facts you would otherwise "
                "have to guess. After collecting tool results, give a concise final answer."
            ),
        },
        {"role": "user", "content": req.question},
    ]

    timeline: list[dict] = [{"role": "user", "content": req.question}]
    loop_trace: list[dict] = []
    last_call_anatomy: dict | None = None
    last_result_anatomy: dict | None = None
    total_prompt = 0
    total_completion = 0
    iterations = 0
    MAX_ITERS = 5
    final_answer = ""
    tools_used: list[str] = []

    try:
        for _ in range(MAX_ITERS):
            iterations += 1
            completion = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=_TOOLS,
                tool_choice="auto",
            )
            usage = completion.usage
            total_prompt += usage.prompt_tokens if usage else 0
            total_completion += usage.completion_tokens if usage else 0

            msg = completion.choices[0].message
            tool_calls = getattr(msg, "tool_calls", None) or []

            assistant_record: dict = {"role": "assistant"}
            if msg.content:
                assistant_record["content"] = msg.content
            if tool_calls:
                assistant_record["tool_calls"] = [
                    {
                        "id": tc.id,
                        "name": tc.function.name,
                        "arguments": _safe_json(tc.function.arguments),
                    }
                    for tc in tool_calls
                ]
                for tc in tool_calls:
                    tools_used.append(tc.function.name)
            timeline.append(assistant_record)

            if msg.content and msg.content.strip():
                loop_trace.append(
                    {
                        "iteration": iterations,
                        "type": "model_thought",
                        "content": msg.content.strip(),
                    }
                )

            if not tool_calls:
                final_answer = msg.content or ""
                break

            messages.append(
                {
                    "role": "assistant",
                    "content": msg.content,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in tool_calls
                    ],
                }
            )

            for tc in tool_calls:
                args = _safe_json(tc.function.arguments)

                loop_trace.append(
                    {
                        "iteration": iterations,
                        "type": "tool_call",
                        "tool": tc.function.name,
                        "input": args,
                    }
                )
                last_call_anatomy = {
                    "type": "tool_use",
                    "id": tc.id,
                    "name": tc.function.name,
                    "input": args,
                }

                handler = _TOOL_DISPATCH.get(tc.function.name)
                if handler is None:
                    result: dict = {"error": f"Unknown tool {tc.function.name}"}
                else:
                    result = handler(args)
                timeline.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "name": tc.function.name,
                        "result": result,
                    }
                )

                is_error = "error" in result
                trace_entry: dict = {
                    "iteration": iterations,
                    "type": "tool_result",
                    "tool": tc.function.name,
                    "result": result,
                    "is_error": is_error,
                }
                if is_error:
                    trace_entry["error"] = str(result.get("error", ""))
                loop_trace.append(trace_entry)

                last_result_anatomy = {
                    "type": "tool_result",
                    "tool_use_id": tc.id,
                    "content": json.dumps(result),
                }

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(result),
                    }
                )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"{prov} call failed: {type(e).__name__}: {e}",
        )

    track(
        day="day03",
        endpoint="/agent",
        provider=prov,
        model=model,
        prompt_tokens=total_prompt,
        completion_tokens=total_completion,
    )

    return {
        "question": req.question,
        "answer": final_answer,
        "timeline": timeline,
        "loop_trace": loop_trace,
        "tool_anatomy": {
            "last_call": last_call_anatomy,
            "last_result": last_result_anatomy,
        },
        "iterations": iterations,
        "tools_used": sorted(set(tools_used)),
        "prompt_tokens": total_prompt,
        "completion_tokens": total_completion,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# N15 — Prompt Caching
# ───────────────────────────────────────────────────────────────────

# A long fixed system prefix to push prompts over OpenAI's 1024-token
# auto-caching threshold. Identical across runs so the cache can match.
_CACHE_KB = """
You are an expert AI engineering tutor. The following knowledge base must be
consulted before answering any question. Always check it for relevant context
before forming a response. Be specific, precise, and refer back to the
relevant section when applicable.

== Section 1: Large Language Models ==
A large language model (LLM) is a neural network trained on enormous text
corpora to predict the next token given previous tokens. Modern LLMs use the
Transformer architecture, introduced in 2017 by Vaswani et al. in the paper
"Attention Is All You Need". The Transformer replaced earlier recurrent and
convolutional approaches with self-attention, which lets every token attend to
every other token in the input regardless of distance. Key components include
multi-head self-attention, residual connections, layer normalization, and
position-wise feed-forward sublayers. Training proceeds in two main phases:
pre-training on broad unlabeled text via next-token prediction, then alignment
on supervised data or preference data via reinforcement learning from human
feedback (RLHF) or related techniques like DPO. The result is a model that
can perform a wide variety of natural-language tasks via prompting alone.

== Section 2: Tokens and Tokenization ==
Tokens are the discrete units LLMs operate on — typically subword pieces
produced by a byte-pair encoding (BPE) or similar tokenizer like SentencePiece
or tiktoken. Common English words map to one token; rare or compound words
split into multiple tokens. A rough heuristic is one token per 0.75 English
words, or roughly four characters per token. Token counts directly drive both
cost and latency: input tokens are the prompt fed to the model, output tokens
are the generated response. Different providers use different tokenizers so
the same text can have different token counts across OpenAI, Anthropic, and
Google models.

== Section 3: Embeddings ==
Embeddings are dense vectors that represent the meaning of text in a
high-dimensional space, typically 768 or 1536 dimensions for modern English
models. Texts with similar meaning have vectors close together by cosine
distance or dot product. Embeddings power semantic search, classification,
clustering, recommendation systems, anomaly detection, and Retrieval-Augmented
Generation. Producing an embedding is much cheaper per token than running a
full chat completion because the model only runs the encoder portion.

== Section 4: Retrieval-Augmented Generation (RAG) ==
RAG combines a vector database with an LLM to answer questions over a
knowledge base the model never saw during training. The flow is: (1) chunk
source documents into passages of a few hundred tokens with some overlap;
(2) embed each chunk and store both the text and vector in a vector database
such as pgvector, Pinecone, or Weaviate; (3) at query time, embed the user
question; (4) retrieve the top-k most similar chunks by cosine distance;
(5) feed those chunks plus the question into the LLM as context; (6) let the
LLM generate the final answer grounded in the retrieved chunks. RAG is
preferred over fine-tuning when the knowledge changes frequently, when you
need source attribution, or when fine-tuning data is too small.

== Section 5: Function Calling and Agents ==
Function calling lets an LLM request external operations rather than guessing.
The model emits a structured JSON call naming a tool and its arguments; the
application executes the tool and returns the result; the model continues
with the result in context. An agent is an LLM placed in a loop that picks
tools, observes results, and decides when to stop. Common tools include
calculators, web search, code execution, database queries, file operations,
and other models. Multi-agent systems use specialized agents that communicate
through messages or a shared scratchpad to tackle complex tasks.

== Section 6: Prompt Caching ==
Prompt caching reuses computation for repeated prompt prefixes. OpenAI caches
prefixes longer than 1024 tokens automatically and reports cached_tokens in
the usage payload under prompt_tokens_details. DeepSeek reports
prompt_cache_hit_tokens and prompt_cache_miss_tokens directly on the usage
object. Cached tokens are typically billed at a discount (often 50 percent
of the input price for OpenAI, even lower for DeepSeek) and respond faster
because the model skips the prefill step for the cached portion of the
prompt. To maximize cache hits, place stable content like system prompts and
long instructions at the start, and put variable content like the user's
specific question at the end.

== Section 7: Fine-tuning and Adaptation ==
Fine-tuning continues training a pre-trained model on a smaller domain-specific
dataset to specialize it. Full fine-tuning updates all weights and requires
substantial compute. Parameter-efficient methods like LoRA (Low-Rank
Adaptation) freeze the base model and learn small adapter matrices, which is
faster and cheaper. Use fine-tuning when you need a consistent style, when
RAG is too slow, or when the task structure is unusual. Avoid fine-tuning
for facts that change often; RAG handles that better.

== Section 8: Evaluation ==
Evaluating LLM outputs is harder than evaluating classifiers because answers
are open-ended. Common approaches include exact match for closed-answer
benchmarks, BLEU and ROUGE for generation, embedding similarity for semantic
matching, and LLM-as-judge where another model scores outputs against
criteria. Build evaluation sets that reflect real user traffic and rerun
them on every prompt or model change.

== End of knowledge base ==
""".strip()


class CacheRequest(BaseModel):
    prompt: str
    provider: str | None = None
    runs: int = 2


@router.post("/cache")
def cache(req: CacheRequest):
    if req.runs < 2 or req.runs > 5:
        raise HTTPException(
            status_code=400, detail="runs must be between 2 and 5"
        )

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    cache_supported = prov in ("openai", "deepseek")

    runs_out = []
    for i in range(req.runs):
        start = time.perf_counter()
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": _CACHE_KB},
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
        cached_tokens = _extract_cached_tokens(usage)
        answer = completion.choices[0].message.content or ""

        track(
            day="day03",
            endpoint="/cache",
            provider=prov,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

        runs_out.append(
            {
                "index": i + 1,
                "latency_ms": round(elapsed_ms, 1),
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "cached_tokens": cached_tokens,
                "answer": answer,
            }
        )

    if cache_supported:
        note = (
            f"{prov} reports cached tokens in the usage payload. The second run "
            "should reuse the long system prefix and show non-zero cached tokens "
            "with lower latency."
        )
    else:
        note = (
            f"{prov} does not expose cache-hit info via the OpenAI-compatible API. "
            "Latency may still improve due to server-side caching, but cached_tokens "
            "will read 0."
        )

    return {
        "runs": runs_out,
        "cache_supported": cache_supported,
        "note": note,
        "prefix_chars": len(_CACHE_KB),
        "prefix_tokens_estimate": len(_CACHE_KB) // 4,
        "provider": prov,
        "model": model,
    }


def _extract_cached_tokens(usage) -> int:
    """Pull cached prompt tokens from the OpenAI-compatible usage payload.

    OpenAI: usage.prompt_tokens_details.cached_tokens
    DeepSeek: usage.prompt_cache_hit_tokens
    Others: 0
    """
    if usage is None:
        return 0
    details = getattr(usage, "prompt_tokens_details", None)
    if details is not None:
        cached = getattr(details, "cached_tokens", None)
        if cached is not None:
            try:
                return int(cached)
            except Exception:
                pass
    cached = getattr(usage, "prompt_cache_hit_tokens", None)
    if cached is not None:
        try:
            return int(cached)
        except Exception:
            pass
    return 0
