import ast
import json
import operator as op

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from provider import get_client, get_model, get_provider
from token_tracker import track

router = APIRouter()


def _usage(completion) -> tuple[int, int]:
    u = completion.usage
    return (u.prompt_tokens if u else 0, u.completion_tokens if u else 0)


def _fail(prov: str, e: Exception) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail=f"{prov} call failed: {type(e).__name__}: {e}",
    )


# ───────────────────────────────────────────────────────────────────
# N16 — Structured output
# ───────────────────────────────────────────────────────────────────

class StructuredRequest(BaseModel):
    description: str
    provider: str | None = None


_STRUCTURED_SYSTEM = (
    "You extract structured product information from a free-text description. "
    "Reply ONLY as JSON with exactly these keys: "
    "name (string), "
    "category (string), "
    'price_range (one of "budget" | "mid" | "premium" | "unknown"), '
    'sentiment (one of "positive" | "negative" | "neutral"), '
    "key_features (array of 2 to 5 short strings), "
    "summary (one concise sentence). "
    "No markdown. No extra keys."
)


@router.post("/structured")
def structured(req: StructuredRequest):
    if not req.description.strip():
        raise HTTPException(status_code=400, detail="description is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _STRUCTURED_SYSTEM},
                {"role": "user", "content": req.description},
            ],
        )
    except Exception as e:
        raise _fail(prov, e)

    content = completion.choices[0].message.content or "{}"
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        parsed = {}

    pt, ct = _usage(completion)
    track(
        day="day04",
        endpoint="/structured",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    feats = parsed.get("key_features", [])
    if not isinstance(feats, list):
        feats = []

    price = str(parsed.get("price_range", "unknown"))
    if price not in ("budget", "mid", "premium", "unknown"):
        price = "unknown"
    sentiment = str(parsed.get("sentiment", "neutral"))
    if sentiment not in ("positive", "negative", "neutral"):
        sentiment = "neutral"

    return {
        "name": str(parsed.get("name", "")),
        "category": str(parsed.get("category", "")),
        "price_range": price,
        "sentiment": sentiment,
        "key_features": [str(f) for f in feats][:5],
        "summary": str(parsed.get("summary", "")),
        "raw": content,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# N17 — System prompting
# ───────────────────────────────────────────────────────────────────

class SystemRequest(BaseModel):
    question: str
    provider: str | None = None


_SYSTEM_VARIANTS = [
    {
        "id": "none",
        "label": "No system prompt",
        "system": "",
        "note": "Baseline. The model answers however it was trained to.",
    },
    {
        "id": "concise",
        "label": "Terse expert",
        "system": (
            "You are a terse senior expert. Answer in one sentence. "
            "No preamble, no caveats, no closing pleasantries."
        ),
        "note": "Same question, but the system prompt forces brevity.",
    },
    {
        "id": "eli5",
        "label": "Explain like I'm 5",
        "system": (
            "You explain everything to a curious 5-year-old using one "
            "everyday analogy and zero jargon. Keep it under 4 sentences."
        ),
        "note": "The system prompt changes the audience and tone.",
    },
]


@router.post("/system")
def system_prompting(req: SystemRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    results = []
    for v in _SYSTEM_VARIANTS:
        messages: list[dict] = []
        if v["system"]:
            messages.append({"role": "system", "content": v["system"]})
        messages.append({"role": "user", "content": req.question})
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=messages,
            )
        except Exception as e:
            raise _fail(prov, e)
        pt, ct = _usage(completion)
        track(
            day="day04",
            endpoint="/system",
            provider=prov,
            model=model,
            prompt_tokens=pt,
            completion_tokens=ct,
        )
        results.append(
            {
                "id": v["id"],
                "label": v["label"],
                "system": v["system"],
                "note": v["note"],
                "answer": completion.choices[0].message.content or "",
                "prompt_tokens": pt,
                "completion_tokens": ct,
            }
        )

    return {
        "results": results,
        "question": req.question,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# N18 — Role & behavior control
# ───────────────────────────────────────────────────────────────────

ROLE_PRESETS = {
    "security_engineer": (
        "You are a senior application security engineer. Be precise and "
        "skeptical. Name the specific vulnerability class, the risk, and a "
        "concrete mitigation. No fluff."
    ),
    "kindergarten_teacher": (
        "You are a patient kindergarten teacher. Use playful language and a "
        "tiny story. Never use a technical word without turning it into a toy "
        "or animal."
    ),
    "unix_manpage": (
        "You are a terse Unix man page. Use imperative mood, SECTION HEADERS "
        "in capitals, and no pleasantries. Be exhaustive but dry."
    ),
}


class RoleRequest(BaseModel):
    task: str
    role: str  # a key in ROLE_PRESETS, or free-text custom role
    provider: str | None = None


@router.post("/role")
def role_control(req: RoleRequest):
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="task is required")
    if not req.role.strip():
        raise HTTPException(status_code=400, detail="role is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    role_system = ROLE_PRESETS.get(req.role, req.role)

    def _call(messages: list[dict]):
        try:
            return client.chat.completions.create(
                model=model, messages=messages
            )
        except Exception as e:
            raise _fail(prov, e)

    plain = _call([{"role": "user", "content": req.task}])
    p_pt, p_ct = _usage(plain)
    track(
        day="day04",
        endpoint="/role",
        provider=prov,
        model=model,
        prompt_tokens=p_pt,
        completion_tokens=p_ct,
    )

    roled = _call(
        [
            {"role": "system", "content": role_system},
            {"role": "user", "content": req.task},
        ]
    )
    r_pt, r_ct = _usage(roled)
    track(
        day="day04",
        endpoint="/role",
        provider=prov,
        model=model,
        prompt_tokens=r_pt,
        completion_tokens=r_ct,
    )

    second_key = next(
        (k for k in ROLE_PRESETS if k != req.role),
        next(iter(ROLE_PRESETS)),
    )
    second_system = ROLE_PRESETS[second_key]
    second = _call(
        [
            {"role": "system", "content": second_system},
            {"role": "user", "content": req.task},
        ]
    )
    s_pt, s_ct = _usage(second)
    track(
        day="day04",
        endpoint="/role",
        provider=prov,
        model=model,
        prompt_tokens=s_pt,
        completion_tokens=s_ct,
    )

    plain_answer = plain.choices[0].message.content or ""
    roled_answer = roled.choices[0].message.content or ""
    second_answer = second.choices[0].message.content or ""

    results = [
        {
            "role_key": "",
            "role_name": "No role",
            "answer": plain_answer,
            "prompt_tokens": p_pt,
            "completion_tokens": p_ct,
        },
        {
            "role_key": req.role,
            "role_name": req.role,
            "answer": roled_answer,
            "prompt_tokens": r_pt,
            "completion_tokens": r_ct,
        },
        {
            "role_key": second_key,
            "role_name": second_key,
            "answer": second_answer,
            "prompt_tokens": s_pt,
            "completion_tokens": s_ct,
        },
    ]

    return {
        "task": req.task,
        "role": req.role,
        "role_system": role_system,
        "plain": {
            "answer": plain_answer,
            "prompt_tokens": p_pt,
            "completion_tokens": p_ct,
        },
        "roled": {
            "answer": roled_answer,
            "prompt_tokens": r_pt,
            "completion_tokens": r_ct,
        },
        "results": results,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# N19 — ReAct (Reasoning + Acting)
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
    raise ValueError("only numbers and + - * / ** % allowed")


def _calculator(expr: str) -> str:
    try:
        val = _safe_arith(ast.parse(expr, mode="eval").body)
        if val == int(val):
            val = int(val)
        return f"{expr} = {val}"
    except Exception as e:
        return f"calculator error: {type(e).__name__}: {e}"


_FACTS = {
    "speed of light": "The speed of light in vacuum is 299,792,458 m/s.",
    "earth radius": "Earth's mean radius is about 6,371 km.",
    "pi": "Pi is approximately 3.14159.",
    "water boiling point": "Water boils at 100 °C at sea level.",
    "days in a year": "A common year has 365 days; a leap year has 366.",
}


def _lookup(topic: str) -> str:
    key = topic.strip().lower()
    for k, v in _FACTS.items():
        if k in key or key in k:
            return v
    return (
        f"No exact entry for '{topic}'. General knowledge: this is a "
        "well-known concept; reason from first principles."
    )


_REACT_SYSTEM = (
    "You solve the user's question using the ReAct pattern (Reason + Act).\n"
    "On every turn output EXACTLY ONE step, in one of these two forms:\n"
    "\n"
    "Thought: <one short reasoning sentence>\n"
    "Action: <calculator OR lookup>\n"
    "Action Input: <the input for the tool>\n"
    "\n"
    "or, when you can answer:\n"
    "\n"
    "Thought: <one short reasoning sentence>\n"
    "Final Answer: <the answer>\n"
    "\n"
    "Tools:\n"
    "- calculator: evaluates arithmetic, e.g. '24 * (7 + 1)'\n"
    "- lookup: returns a short fact for a topic string\n"
    "\n"
    "Rules: output only the next single step. Never write 'Observation:' "
    "yourself — the system appends it. Keep Thoughts to one sentence."
)


class ReactRequest(BaseModel):
    question: str
    provider: str | None = None


def _parse_react(text: str) -> dict:
    """Pull the Thought / Action / Action Input / Final Answer out of one step."""
    thought = ""
    action = ""
    action_input = ""
    final = ""
    for raw in text.splitlines():
        line = raw.strip()
        low = line.lower()
        if low.startswith("thought:"):
            thought = line[len("thought:"):].strip()
        elif low.startswith("action input:"):
            action_input = line[len("action input:"):].strip()
        elif low.startswith("action:"):
            action = line[len("action:"):].strip()
        elif low.startswith("final answer:"):
            final = line[len("final answer:"):].strip()
    return {
        "thought": thought,
        "action": action,
        "action_input": action_input,
        "final": final,
    }


@router.post("/react")
def react(req: ReactRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    messages: list[dict] = [
        {"role": "system", "content": _REACT_SYSTEM},
        {"role": "user", "content": f"Question: {req.question}"},
    ]

    steps: list[dict] = []
    total_pt = 0
    total_ct = 0
    answer = ""
    iterations = 0
    MAX_ITERS = 6

    try:
        for _ in range(MAX_ITERS):
            iterations += 1
            completion = client.chat.completions.create(
                model=model,
                messages=messages,
                stop=["Observation:"],
            )
            pt, ct = _usage(completion)
            total_pt += pt
            total_ct += ct
            raw = completion.choices[0].message.content or ""
            parsed = _parse_react(raw)

            if parsed["thought"]:
                steps.append({"type": "thought", "text": parsed["thought"]})

            if parsed["final"]:
                answer = parsed["final"]
                steps.append({"type": "answer", "text": answer})
                break

            if not parsed["action"]:
                answer = raw.strip()
                steps.append({"type": "answer", "text": answer})
                break

            tool = parsed["action"].lower()
            tool_input = parsed["action_input"]
            steps.append(
                {
                    "type": "action",
                    "tool": tool,
                    "input": tool_input,
                }
            )

            if "calculator" in tool:
                observation = _calculator(tool_input)
            elif "lookup" in tool:
                observation = _lookup(tool_input)
            else:
                observation = f"unknown tool '{tool}'"

            steps.append({"type": "observation", "text": observation})

            messages.append({"role": "assistant", "content": raw})
            messages.append(
                {"role": "user", "content": f"Observation: {observation}"}
            )
    except Exception as e:
        raise _fail(prov, e)

    track(
        day="day04",
        endpoint="/react",
        provider=prov,
        model=model,
        prompt_tokens=total_pt,
        completion_tokens=total_ct,
    )

    return {
        "question": req.question,
        "steps": steps,
        "answer": answer,
        "iterations": iterations,
        "prompt_tokens": total_pt,
        "completion_tokens": total_ct,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# N20 — Sampling / temperature
# ───────────────────────────────────────────────────────────────────

class TemperatureRequest(BaseModel):
    prompt: str
    temperatures: list[float] = [0.0, 0.7, 1.4]
    provider: str | None = None


@router.post("/temperature")
def temperature(req: TemperatureRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt is required")
    if not req.temperatures:
        raise HTTPException(status_code=400, detail="temperatures is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    results = []
    for t in req.temperatures:
        temp = max(0.0, min(2.0, float(t)))
        try:
            completion = client.chat.completions.create(
                model=model,
                temperature=temp,
                messages=[{"role": "user", "content": req.prompt}],
            )
        except Exception as e:
            raise _fail(prov, e)
        pt, ct = _usage(completion)
        track(
            day="day04",
            endpoint="/temperature",
            provider=prov,
            model=model,
            prompt_tokens=pt,
            completion_tokens=ct,
        )
        results.append(
            {
                "temperature": temp,
                "response": completion.choices[0].message.content or "",
                "prompt_tokens": pt,
                "completion_tokens": ct,
            }
        )

    return {
        "results": results,
        "prompt": req.prompt,
        "provider": prov,
        "model": model,
    }
