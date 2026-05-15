import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from provider import (
    BEGINNER_SYSTEM_PROMPT,
    generate_diagram,
    get_client,
    get_model,
    get_provider,
    stream_chat,
)
from token_tracker import track

router = APIRouter()

SYSTEM_PROMPT = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "Reply only as JSON with these keys:\n"
    "  answer_en  (a single English string)\n"
    "  answer_id  (a single Indonesian string)\n"
    "  diagram    (null OR an object — see below)\n"
    "\n"
    "answer_en and answer_id MUST be plain strings — never nested objects, "
    "arrays, or markdown. Use \\n for line breaks inside the string. "
    "Equal detail in both languages.\n"
    "\n"
    "For topics that are naturally step-by-step or flow-based (e.g. RAG pipeline, "
    "agent loop, function calling, multi-agent flow, vector DB query), include a "
    "'diagram' object with this shape:\n"
    "  {\n"
    "    \"title\": \"short title\",\n"
    "    \"steps\": [{\"id\": 1, \"label\": \"Step label\", \"sublabel\": \"optional one-line detail\"}, ...],\n"
    "    \"connections\": [[1,2], [2,3], ...]\n"
    "  }\n"
    "For conceptual or definition topics, set diagram to null. "
    "No markdown. No extra keys."
)


def _to_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "\n".join(_to_text(v) for v in value)
    if isinstance(value, dict):
        return "\n".join(f"{k}: {_to_text(v)}" for k, v in value.items())
    return str(value)


class AskRequest(BaseModel):
    question: str
    provider: str | None = None


@router.post("/ask")
def ask(req: AskRequest):
    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
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
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"Model returned invalid JSON: {e}")

    usage = completion.usage
    prompt_tokens = usage.prompt_tokens if usage else 0
    completion_tokens = usage.completion_tokens if usage else 0

    track(
        day="day01",
        endpoint="/ask",
        provider=prov,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )

    raw_diagram = parsed.get("diagram")
    diagram = raw_diagram if _is_valid_diagram_shape(raw_diagram) else None

    return {
        "answer_en": _to_text(parsed.get("answer_en", "")),
        "answer_id": _to_text(parsed.get("answer_id", "")),
        "diagram": diagram,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "provider": prov,
        "model": model,
    }


def _is_valid_diagram_shape(d) -> bool:
    if d is None:
        return True
    if not isinstance(d, dict):
        return False
    steps = d.get("steps")
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
    connections = d.get("connections", [])
    if not isinstance(connections, list):
        return False
    for c in connections:
        if not (isinstance(c, list) and len(c) == 2):
            return False
        if c[0] not in ids or c[1] not in ids:
            return False
    return True


STREAM_SYSTEM_PROMPT = (
    BEGINNER_SYSTEM_PROMPT
    + "\n\n"
    + "LANGUAGE RULE — CRITICAL:\n"
    "  • Detect the language of the user's question.\n"
    "  • If the question is in English, reply entirely in English.\n"
    "  • If the question is in Indonesian (Bahasa Indonesia), reply entirely in Indonesian.\n"
    "  • Never mix languages. Never translate. Never add a translation.\n"
    "Style: plain text only — no markdown, no JSON, no code fences. The diagram, "
    "if any, will be produced by a separate call — do not include diagram syntax in your reply."
)


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/ask/stream")
def ask_stream(req: AskRequest):
    prov = get_provider(req.provider)
    model = get_model(req.provider)

    def gen():
        prompt_tokens = 0
        completion_tokens = 0
        full_answer = ""
        try:
            for chunk in stream_chat(
                req.provider,
                messages=[
                    {"role": "system", "content": STREAM_SYSTEM_PROMPT},
                    {"role": "user", "content": req.question},
                ],
            ):
                kind = chunk["kind"]
                if kind == "thinking":
                    yield _sse("thinking", {"delta": chunk["delta"]})
                elif kind == "answer":
                    full_answer += chunk["delta"]
                    yield _sse("answer", {"delta": chunk["delta"]})
                elif kind == "usage":
                    prompt_tokens = chunk["prompt_tokens"]
                    completion_tokens = chunk["completion_tokens"]
        except Exception as e:
            yield _sse("error", {"detail": f"{type(e).__name__}: {e}"})
            return

        track(
            day="day01",
            endpoint="/ask/stream",
            provider=prov,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

        diagram_result = generate_diagram(req.provider, req.question, full_answer)
        diagram = diagram_result["diagram"] if diagram_result else None
        if diagram_result:
            track(
                day="day01",
                endpoint="/ask/stream/diagram",
                provider=prov,
                model=model,
                prompt_tokens=diagram_result["prompt_tokens"],
                completion_tokens=diagram_result["completion_tokens"],
            )
        yield _sse("diagram", {"diagram": diagram})

        yield _sse(
            "done",
            {
                "provider": prov,
                "model": model,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
            },
        )

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
