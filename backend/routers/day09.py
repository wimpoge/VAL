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
# Shared helpers
# ───────────────────────────────────────────────────────────────────

def _usage(completion) -> tuple[int, int]:
    u = completion.usage
    return (u.prompt_tokens if u else 0, u.completion_tokens if u else 0)


def _fail(prov: str, e: Exception) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail=f"{prov} call failed: {type(e).__name__}: {e}",
    )


def _safe_json(s: str | None) -> dict:
    if not s:
        return {}
    try:
        v = json.loads(s)
        return v if isinstance(v, dict) else {}
    except Exception:
        return {}


# ───────────────────────────────────────────────────────────────────
# Tools — calculate, get_weather, search_web
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


def _calculate(expression: str) -> dict:
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


# Tiny canned "search index" so multi-agent demos return believable facts
# without any network dependency. Match is keyword-based; falls back to a
# generic snippet so the agent always gets something to cite.
_SEARCH_INDEX = [
    {
        "keywords": ["rag", "retrieval", "augmented"],
        "title": "Retrieval-Augmented Generation overview",
        "snippet": (
            "RAG injects retrieved document chunks into the prompt so the LLM "
            "can answer from your private knowledge base without retraining."
        ),
    },
    {
        "keywords": ["agent", "loop", "tool", "function calling"],
        "title": "AI agents and the tool-use loop",
        "snippet": (
            "An AI agent is an LLM placed in a loop: it picks a tool, observes "
            "the result, and decides whether to call another tool or finish."
        ),
    },
    {
        "keywords": ["embedding", "vector", "cosine"],
        "title": "Embeddings and cosine similarity",
        "snippet": (
            "Embeddings turn text into high-dimensional vectors so that "
            "semantically similar texts land close together by cosine distance."
        ),
    },
    {
        "keywords": ["pgvector", "postgres", "database"],
        "title": "pgvector: vector search inside Postgres",
        "snippet": (
            "pgvector adds a vector column type and the <=> cosine-distance "
            "operator to Postgres, so similarity search is just a SQL query."
        ),
    },
    {
        "keywords": ["depok", "jakarta", "indonesia"],
        "title": "Greater Jakarta cities",
        "snippet": (
            "Depok is a city in West Java directly south of Jakarta, part of "
            "the Jabodetabek metropolitan area, home to ~2 million residents."
        ),
    },
    {
        "keywords": ["langgraph", "langchain"],
        "title": "LangGraph framework",
        "snippet": (
            "LangGraph models agents as state graphs with explicit nodes and "
            "edges, giving you durable execution, branching, and human-in-loop."
        ),
    },
    {
        "keywords": ["openai", "agents", "sdk"],
        "title": "OpenAI Agents SDK",
        "snippet": (
            "The OpenAI Agents SDK wraps the tool-calling API with handoffs, "
            "guardrails, and tracing, so multi-agent flows fit in a few lines."
        ),
    },
    {
        "keywords": ["crewai", "crew"],
        "title": "CrewAI framework",
        "snippet": (
            "CrewAI lets you declare role-based agents (researcher, analyst, "
            "writer) plus tasks, and orchestrates them sequentially or in parallel."
        ),
    },
]


def _search_web(query: str) -> dict:
    q = (query or "").lower()
    hits: list[dict] = []
    for row in _SEARCH_INDEX:
        if any(kw in q for kw in row["keywords"]):
            hits.append({"title": row["title"], "snippet": row["snippet"]})
    if not hits:
        hits.append(
            {
                "title": f"General notes on {query}",
                "snippet": (
                    f"No exact match for '{query}' in the demo index. "
                    "Treat as a topic the agent must reason about from "
                    "first principles."
                ),
            }
        )
    return {"query": query, "results": hits[:3]}


_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": (
                "Evaluate a numeric arithmetic expression. Use for any math."
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
                        "description": "City name, e.g. 'Depok'",
                    }
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": (
                "Search a small demo knowledge base for facts about AI "
                "engineering or general topics. Use when you need information "
                "you cannot derive yourself."
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
    "calculate": lambda args: _calculate(args.get("expression", "")),
    "get_weather": lambda args: _get_weather(args.get("city", "")),
    "search_web": lambda args: _search_web(args.get("query", "")),
}


TOOL_CATALOG = [
    {
        "name": "calculate",
        "description": "Safe arithmetic evaluator (numbers + - * / ** ( )).",
        "example": {"expression": "24 * 7"},
    },
    {
        "name": "get_weather",
        "description": "Deterministic mock weather (seeded per city).",
        "example": {"city": "Depok"},
    },
    {
        "name": "search_web",
        "description": "Canned demo search index of AI-engineering snippets.",
        "example": {"query": "what is RAG"},
    },
]


# ───────────────────────────────────────────────────────────────────
# N43 — Tool-calling agent loop  (POST /agent)
# ───────────────────────────────────────────────────────────────────

class AgentRequest(BaseModel):
    question: str
    provider: str | None = None
    max_iterations: int = 5


def _run_agent_loop(
    *,
    client,
    model: str,
    system_prompt: str,
    user_question: str,
    max_iterations: int,
    endpoint: str,
    prov: str,
    label: str | None = None,
) -> dict:
    """Run an OpenAI-style tool-calling loop and return a full trace.

    Returns dict: {answer, steps, iterations, prompt_tokens, completion_tokens,
                   tools_used, latency_ms}
    """
    messages: list[dict] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_question},
    ]

    steps: list[dict] = [
        {
            "kind": "user",
            "content": user_question,
            **({"agent": label} if label else {}),
        }
    ]
    total_prompt = 0
    total_completion = 0
    iterations = 0
    tools_used: list[str] = []
    final_answer = ""
    t0 = time.perf_counter()

    for _ in range(max(1, min(max_iterations, 8))):
        iterations += 1
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=_TOOLS,
                tool_choice="auto",
            )
        except Exception as e:
            raise _fail(prov, e)

        pt, ct = _usage(completion)
        total_prompt += pt
        total_completion += ct

        msg = completion.choices[0].message
        tool_calls = getattr(msg, "tool_calls", None) or []

        # Record the assistant's turn — may include thought (content) and/or
        # tool calls.
        if msg.content and msg.content.strip():
            steps.append(
                {
                    "kind": "thought",
                    "iteration": iterations,
                    "content": msg.content.strip(),
                    **({"agent": label} if label else {}),
                }
            )

        if not tool_calls:
            final_answer = msg.content or ""
            break

        # Append assistant message with tool_calls to the model conversation
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
            tools_used.append(tc.function.name)

            handler = _TOOL_DISPATCH.get(tc.function.name)
            if handler is None:
                result: dict = {"error": f"Unknown tool {tc.function.name}"}
            else:
                try:
                    result = handler(args)
                except Exception as e:
                    result = {"error": f"{type(e).__name__}: {e}"}

            steps.append(
                {
                    "kind": "tool_call",
                    "iteration": iterations,
                    "tool": tc.function.name,
                    "args": args,
                    "result": result,
                    "is_error": "error" in result,
                    **({"agent": label} if label else {}),
                }
            )

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result),
                }
            )

    if final_answer:
        steps.append(
            {
                "kind": "answer",
                "iteration": iterations,
                "content": final_answer,
                **({"agent": label} if label else {}),
            }
        )

    latency_ms = int((time.perf_counter() - t0) * 1000)

    track(
        day="day09",
        endpoint=endpoint,
        provider=prov,
        model=model,
        prompt_tokens=total_prompt,
        completion_tokens=total_completion,
    )

    return {
        "answer": final_answer,
        "steps": steps,
        "iterations": iterations,
        "prompt_tokens": total_prompt,
        "completion_tokens": total_completion,
        "tools_used": sorted(set(tools_used)),
        "latency_ms": latency_ms,
    }


_AGENT_SYSTEM = (
    "You are an autonomous assistant with access to three tools: "
    "calculate (math), get_weather (city -> conditions), and search_web "
    "(facts lookup). When the user asks a question, decide which tools to "
    "call. Always call calculate for math instead of guessing. Always call "
    "get_weather for weather questions. Use search_web when you need facts "
    "you would otherwise have to invent. After collecting tool results, "
    "give one concise final answer in the same language as the question. "
    "No markdown headers. No preamble."
)


@router.post("/agent")
def agent(req: AgentRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    result = _run_agent_loop(
        client=client,
        model=model,
        system_prompt=_AGENT_SYSTEM,
        user_question=req.question,
        max_iterations=req.max_iterations,
        endpoint="/agent",
        prov=prov,
    )

    return {
        "question": req.question,
        **result,
        "total_tokens": result["prompt_tokens"] + result["completion_tokens"],
        "provider": prov,
        "model": model,
        "tools_available": [t["function"]["name"] for t in _TOOLS],
    }


# ───────────────────────────────────────────────────────────────────
# N44 — Multi-agent system  (POST /multi-agent)
# Researcher (tool-using) → Critic → Writer
# ───────────────────────────────────────────────────────────────────

class MultiAgentRequest(BaseModel):
    topic: str
    provider: str | None = None


_RESEARCHER_SYSTEM = (
    "You are the RESEARCHER agent. Your job is to gather facts about the "
    "user's topic using your tools (search_web, calculate, get_weather). "
    "Call search_web at least once. After tool calls, output a compact "
    "bullet list of 3–5 key facts you found. No prose, no preamble."
)

_CRITIC_SYSTEM = (
    "You are the CRITIC agent. You are given a topic and a RESEARCHER's "
    "fact list. Inspect the facts: which are concrete, which are vague, "
    "which are missing? Reply ONLY as JSON: "
    "{\"verdict\": \"ship\" | \"needs_more\", "
    "\"feedback\": \"one short sentence for the writer\"}. "
    "No markdown. No extra keys."
)

_WRITER_SYSTEM_TMPL = (
    "You are the WRITER agent. Compose a clear two-paragraph answer to "
    "the user's topic. Ground every claim in the RESEARCHER's facts below. "
    "If the CRITIC asked for changes, address that feedback. Write in the "
    "same language as the topic. No markdown headers. No preamble.\n\n"
    "Topic: {topic}\n\n"
    "Researcher facts:\n{facts}\n\n"
    "Critic verdict: {verdict}\n"
    "Critic feedback: {feedback}"
)


def _call_critic(
    *, client, model: str, prov: str, topic: str, facts: str
) -> dict:
    t0 = time.perf_counter()
    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _CRITIC_SYSTEM},
                {
                    "role": "user",
                    "content": f"Topic: {topic}\n\nResearcher facts:\n{facts}",
                },
            ],
        )
    except Exception as e:
        raise _fail(prov, e)
    latency_ms = int((time.perf_counter() - t0) * 1000)

    pt, ct = _usage(completion)
    track(
        day="day09",
        endpoint="/multi-agent",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    parsed = _safe_json(completion.choices[0].message.content)
    verdict = parsed.get("verdict", "ship")
    if verdict not in ("ship", "needs_more"):
        verdict = "ship"
    feedback = str(parsed.get("feedback", ""))[:240]

    return {
        "verdict": verdict,
        "feedback": feedback,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "latency_ms": latency_ms,
    }


def _call_writer(
    *,
    client,
    model: str,
    prov: str,
    topic: str,
    facts: str,
    verdict: str,
    feedback: str,
) -> dict:
    t0 = time.perf_counter()
    system = _WRITER_SYSTEM_TMPL.format(
        topic=topic,
        facts=facts or "(researcher returned no usable facts)",
        verdict=verdict,
        feedback=feedback or "(none)",
    )
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": topic},
            ],
        )
    except Exception as e:
        raise _fail(prov, e)
    latency_ms = int((time.perf_counter() - t0) * 1000)

    pt, ct = _usage(completion)
    track(
        day="day09",
        endpoint="/multi-agent",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "answer": completion.choices[0].message.content or "",
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "latency_ms": latency_ms,
    }


@router.post("/multi-agent")
def multi_agent(req: MultiAgentRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="topic is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    # 1. Researcher: tool-using agent collecting facts
    researcher = _run_agent_loop(
        client=client,
        model=model,
        system_prompt=_RESEARCHER_SYSTEM,
        user_question=req.topic,
        max_iterations=4,
        endpoint="/multi-agent",
        prov=prov,
        label="researcher",
    )
    facts = researcher["answer"]

    # 2. Critic: JSON verdict on the fact list
    critic = _call_critic(
        client=client, model=model, prov=prov, topic=req.topic, facts=facts
    )

    # 3. Writer: composes the final grounded answer
    writer = _call_writer(
        client=client,
        model=model,
        prov=prov,
        topic=req.topic,
        facts=facts,
        verdict=critic["verdict"],
        feedback=critic["feedback"],
    )

    total_pt = (
        researcher["prompt_tokens"]
        + critic["prompt_tokens"]
        + writer["prompt_tokens"]
    )
    total_ct = (
        researcher["completion_tokens"]
        + critic["completion_tokens"]
        + writer["completion_tokens"]
    )

    return {
        "topic": req.topic,
        "researcher": {
            "facts": facts,
            "steps": researcher["steps"],
            "iterations": researcher["iterations"],
            "tools_used": researcher["tools_used"],
            "prompt_tokens": researcher["prompt_tokens"],
            "completion_tokens": researcher["completion_tokens"],
            "latency_ms": researcher["latency_ms"],
        },
        "critic": critic,
        "writer": writer,
        "total_prompt_tokens": total_pt,
        "total_completion_tokens": total_ct,
        "total_tokens": total_pt + total_ct,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# GET /tools — describe the tool catalog (consumed by N43 UI)
# ───────────────────────────────────────────────────────────────────

@router.get("/tools")
def list_tools():
    return {"tools": TOOL_CATALOG}
