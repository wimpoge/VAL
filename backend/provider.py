import json
import os
from typing import Iterator

import openai
from fastapi import APIRouter

BEGINNER_SYSTEM_PROMPT = (
    "You are a friendly AI engineering tutor teaching complete beginners.\n"
    "This app is specifically about AI engineering and LLMs.\n"
    "When the user mentions RAG, it always means Retrieval-Augmented Generation "
    "(not Red Amber Green). When the user mentions tokens, it means LLM tokens "
    "(not authentication tokens). When the user mentions models, it means "
    "AI/ML models (not fashion models or 3D models).\n"
    "Always interpret questions in the context of AI engineering.\n"
    "\n"
    "Explain everything like you would to a curious 10-year-old.\n"
    "\n"
    "Rules:\n"
    "1. Always start with a one-sentence plain answer before any explanation.\n"
    "2. Use a real-life analogy or story to explain every concept.\n"
    "3. Follow the analogy with a concrete mini-example using everyday objects or situations.\n"
    "4. Define every technical term the moment you use it, in parentheses, in one simple phrase.\n"
    "5. Keep sentences short. Max 2 sentences per paragraph.\n"
    "6. Never assume prior knowledge."
)

DIAGRAM_INSTRUCTIONS = (
    "Additionally, for topics that are naturally step-by-step or flow-based, include a "
    "'diagram' field with a steps array and connections array so the UI can render a "
    "visual flow diagram. Only include diagram for topics where a flow genuinely helps "
    "understanding (e.g. RAG pipeline, agent loop, function calling, multi-agent flow, "
    "vector DB query). For conceptual or definition topics, set diagram to null."
)

PROVIDER_CONFIG = {
    "openai": {
        "base_url": None,
        "api_key": os.environ.get("OPENAI_API_KEY"),
        "model": os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key": os.environ.get("GROQ_API_KEY"),
        "model": os.environ.get("GROQ_CHAT_MODEL", "llama-3.1-8b-instant"),
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com",
        "api_key": os.environ.get("DEEPSEEK_API_KEY"),
        "model": os.environ.get("DEEPSEEK_CHAT_MODEL", "deepseek-chat"),
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key": os.environ.get("GEMINI_API_KEY"),
        "model": os.environ.get("GEMINI_CHAT_MODEL", "gemini-2.5-flash-lite"),
    },
}

AVAILABLE_PROVIDERS = ["openai", "groq", "deepseek", "gemini"]


def _resolve(provider: str | None) -> str:
    name = provider or os.environ.get("DEFAULT_PROVIDER", "openai")
    if name not in PROVIDER_CONFIG:
        raise ValueError(f"Unknown provider: {name}")
    return name


def get_client(provider: str | None = None) -> openai.OpenAI:
    name = _resolve(provider)
    cfg = PROVIDER_CONFIG[name]
    if cfg["base_url"]:
        return openai.OpenAI(base_url=cfg["base_url"], api_key=cfg["api_key"])
    return openai.OpenAI(api_key=cfg["api_key"])


def get_model(provider: str | None = None) -> str:
    return PROVIDER_CONFIG[_resolve(provider)]["model"]


def get_provider(provider: str | None = None) -> str:
    return _resolve(provider)


def get_embedding_client() -> openai.OpenAI:
    return openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def stream_chat(
    provider: str | None,
    messages: list[dict],
    **kwargs,
) -> Iterator[dict]:
    """Yield streaming chunks from a chat completion.

    Yields dicts of shape:
      {"kind": "thinking", "delta": str}  — reasoning tokens (DeepSeek-Reasoner)
      {"kind": "answer",   "delta": str}  — visible response tokens
      {"kind": "usage",    "prompt_tokens": int, "completion_tokens": int}

    Token usage is only emitted by providers that honor stream_options.include_usage.
    """
    client = get_client(provider)
    model = get_model(provider)

    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
        stream_options={"include_usage": True},
        **kwargs,
    )

    for chunk in stream:
        if chunk.usage is not None:
            yield {
                "kind": "usage",
                "prompt_tokens": chunk.usage.prompt_tokens or 0,
                "completion_tokens": chunk.usage.completion_tokens or 0,
            }
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        reasoning = getattr(delta, "reasoning_content", None)
        if reasoning:
            yield {"kind": "thinking", "delta": reasoning}
        content = getattr(delta, "content", None)
        if content:
            yield {"kind": "answer", "delta": content}


DIAGRAM_PROMPT = (
    "You produce optional flow-diagram metadata for an AI tutoring app. "
    "Given a user question and the tutor's answer, decide whether a step-by-step "
    "flow diagram would genuinely help the learner. Only emit a diagram for "
    "naturally sequential topics (e.g. RAG pipeline, agent loop, function calling, "
    "multi-agent flow, vector DB query, training loop). For conceptual or "
    "definition topics, return null.\n"
    "\n"
    "Reply ONLY as JSON with exactly one key 'diagram':\n"
    "  {\"diagram\": null}\n"
    "or\n"
    "  {\"diagram\": {\n"
    "     \"title\": \"short title\",\n"
    "     \"steps\": [{\"id\": 1, \"label\": \"Step label\", \"sublabel\": \"optional one-line detail\"}, ...],\n"
    "     \"connections\": [[1,2], [2,3], ...]\n"
    "   }}\n"
    "Rules: id is a positive integer. label ≤ 24 chars. sublabel optional, ≤ 40 chars. "
    "Keep 3–7 steps. connections reference existing ids. No extra keys. No markdown."
)


def generate_diagram(
    provider: str | None, question: str, answer: str
) -> dict | None:
    if not answer.strip():
        return None
    try:
        client = get_client(provider)
        model = get_model(provider)
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": DIAGRAM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Question: {question}\n\nAnswer:\n{answer}\n\n"
                        "Now produce the diagram JSON."
                    ),
                },
            ],
            max_tokens=600,
        )
        content = completion.choices[0].message.content or "{}"
        parsed = json.loads(content)
        diagram = parsed.get("diagram")
        usage = completion.usage
        prompt_tokens = usage.prompt_tokens if usage else 0
        completion_tokens = usage.completion_tokens if usage else 0
        if not _is_valid_diagram(diagram):
            return {
                "diagram": None,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
            }
        return {
            "diagram": diagram,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
        }
    except Exception:
        return None


def _is_valid_diagram(d) -> bool:
    if d is None:
        return True
    if not isinstance(d, dict):
        return False
    steps = d.get("steps")
    connections = d.get("connections")
    title = d.get("title", "")
    if not isinstance(title, str):
        return False
    if not isinstance(steps, list) or not steps:
        return False
    ids = set()
    for s in steps:
        if not isinstance(s, dict):
            return False
        sid = s.get("id")
        label = s.get("label")
        if not isinstance(sid, int) or not isinstance(label, str):
            return False
        ids.add(sid)
    if not isinstance(connections, list):
        return False
    for c in connections:
        if not (isinstance(c, list) and len(c) == 2):
            return False
        a, b = c
        if a not in ids or b not in ids:
            return False
    return True


provider_router = APIRouter()


@provider_router.get("/providers")
def list_providers():
    return {
        "providers": AVAILABLE_PROVIDERS,
        "default": os.environ.get("DEFAULT_PROVIDER", "openai"),
        "models": {p: PROVIDER_CONFIG[p]["model"] for p in AVAILABLE_PROVIDERS},
    }
