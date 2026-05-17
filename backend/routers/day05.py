import json
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from provider import PROVIDER_CONFIG, get_client, get_model, get_provider
from token_tracker import track

router = APIRouter()


# Open-weights providers in this project: Groq serves Llama, DeepSeek ships
# open weights. OpenAI (GPT) and Gemini are closed / proprietary.
_OPEN_PROVIDERS = {"groq", "deepseek"}


def _usage(completion) -> tuple[int, int]:
    u = completion.usage
    return (u.prompt_tokens if u else 0, u.completion_tokens if u else 0)


def _fail(prov: str, e: Exception) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail=f"{prov} call failed: {type(e).__name__}: {e}",
    )


def _kind(provider: str) -> str:
    return "open" if provider in _OPEN_PROVIDERS else "closed"


# ───────────────────────────────────────────────────────────────────
# N21 — Pre-trained models
# ───────────────────────────────────────────────────────────────────

class PretrainedRequest(BaseModel):
    question: str
    provider: str | None = None


_PRETRAINED_SYSTEM = (
    "You are demonstrating what a PRE-TRAINED language model can and cannot "
    "answer from its frozen weights alone (no internet, no tools, no "
    "database). For the user's question, answer as best you can, then judge "
    "which category the question falls into.\n"
    "Reply ONLY as JSON with exactly these keys:\n"
    '  answer (string — your best answer from pre-training alone),\n'
    '  knowledge_type (one of "parametric" | "time_sensitive" | '
    '"private_data"),\n'
    '  why (one short sentence explaining the classification).\n'
    "parametric = stable facts learned during training. "
    "time_sensitive = needs information newer than the training cutoff. "
    "private_data = needs data the model was never trained on (your files, "
    "internal systems). No markdown. No extra keys."
)


@router.post("/pretrained")
def pretrained(req: PretrainedRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _PRETRAINED_SYSTEM},
                {"role": "user", "content": req.question},
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
        day="day05",
        endpoint="/pretrained",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    ktype = str(parsed.get("knowledge_type", "parametric"))
    if ktype not in ("parametric", "time_sensitive", "private_data"):
        ktype = "parametric"

    return {
        "question": req.question,
        "answer": str(parsed.get("answer", "")),
        "knowledge_type": ktype,
        "why": str(parsed.get("why", "")),
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# N22 — Closed vs open source (multi-provider compare)
# ───────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    question: str
    providers: list[str] = ["openai", "groq"]


@router.post("/compare")
def compare(req: CompareRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    wanted = [p for p in req.providers if p in PROVIDER_CONFIG]
    if not wanted:
        raise HTTPException(
            status_code=400,
            detail="provide at least one known provider",
        )

    results = []
    for p in wanted:
        model = get_model(p)
        entry: dict = {
            "provider": p,
            "model": model,
            "kind": _kind(p),
        }
        try:
            client = get_client(p)
            t0 = time.perf_counter()
            completion = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": req.question}],
            )
            latency_ms = int((time.perf_counter() - t0) * 1000)
            pt, ct = _usage(completion)
            track(
                day="day05",
                endpoint="/compare",
                provider=p,
                model=model,
                prompt_tokens=pt,
                completion_tokens=ct,
            )
            entry.update(
                {
                    "answer": completion.choices[0].message.content or "",
                    "latency_ms": latency_ms,
                    "prompt_tokens": pt,
                    "completion_tokens": ct,
                    "error": None,
                }
            )
        except Exception as e:
            entry.update(
                {
                    "answer": "",
                    "latency_ms": None,
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "error": f"{type(e).__name__}: {e}",
                }
            )
        results.append(entry)

    return {"question": req.question, "results": results}


# ───────────────────────────────────────────────────────────────────
# N23 / N24 — Ask one model family (single-language plain answer)
# ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: str | None = None


@router.post("/ask")
def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    try:
        t0 = time.perf_counter()
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": req.question}],
        )
        latency_ms = int((time.perf_counter() - t0) * 1000)
    except Exception as e:
        raise _fail(prov, e)

    pt, ct = _usage(completion)
    track(
        day="day05",
        endpoint="/ask",
        provider=prov,
        model=model,
        prompt_tokens=pt,
        completion_tokens=ct,
    )

    return {
        "question": req.question,
        "answer": completion.choices[0].message.content or "",
        "kind": _kind(prov),
        "latency_ms": latency_ms,
        "prompt_tokens": pt,
        "completion_tokens": ct,
        "provider": prov,
        "model": model,
    }


# ───────────────────────────────────────────────────────────────────
# N25 — Fine-tuning (simulated via few-shot conditioning)
# ───────────────────────────────────────────────────────────────────

class FineTuneExample(BaseModel):
    input: str
    output: str


class FineTuneRequest(BaseModel):
    task: str
    examples: list[FineTuneExample] = []
    test_input: str
    provider: str | None = None


_TUNE_SYSTEM = (
    "You are a model being conditioned on labeled examples. Study the pattern "
    "in the example input/output pairs, then apply exactly that same style, "
    "format, and behavior to the final input. Imitate the examples closely."
)


@router.post("/finetune-vs-prompt")
def finetune_vs_prompt(req: FineTuneRequest):
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="task is required")
    if not req.test_input.strip():
        raise HTTPException(status_code=400, detail="test_input is required")
    if not req.examples:
        raise HTTPException(
            status_code=400, detail="at least one example is required"
        )

    client = get_client(req.provider)
    model = get_model(req.provider)
    prov = get_provider(req.provider)

    def _call(messages: list[dict]):
        try:
            return client.chat.completions.create(
                model=model, messages=messages
            )
        except Exception as e:
            raise _fail(prov, e)

    # Base model: only the task instruction + the test input. No examples —
    # this is what an un-tuned model produces.
    base = _call(
        [
            {"role": "system", "content": req.task},
            {"role": "user", "content": req.test_input},
        ]
    )
    b_pt, b_ct = _usage(base)
    track(
        day="day05",
        endpoint="/finetune-vs-prompt",
        provider=prov,
        model=model,
        prompt_tokens=b_pt,
        completion_tokens=b_ct,
    )

    # "Simulated fine-tune": the examples are injected as prior turns so the
    # model conditions on them at runtime — the cheap approximation of baking
    # them into the weights.
    tuned_messages: list[dict] = [
        {"role": "system", "content": f"{req.task}\n\n{_TUNE_SYSTEM}"}
    ]
    for ex in req.examples:
        tuned_messages.append({"role": "user", "content": ex.input})
        tuned_messages.append({"role": "assistant", "content": ex.output})
    tuned_messages.append({"role": "user", "content": req.test_input})

    tuned = _call(tuned_messages)
    t_pt, t_ct = _usage(tuned)
    track(
        day="day05",
        endpoint="/finetune-vs-prompt",
        provider=prov,
        model=model,
        prompt_tokens=t_pt,
        completion_tokens=t_ct,
    )

    return {
        "task": req.task,
        "test_input": req.test_input,
        "example_count": len(req.examples),
        "base": {
            "answer": base.choices[0].message.content or "",
            "prompt_tokens": b_pt,
            "completion_tokens": b_ct,
        },
        "tuned": {
            "answer": tuned.choices[0].message.content or "",
            "prompt_tokens": t_pt,
            "completion_tokens": t_ct,
        },
        "provider": prov,
        "model": model,
    }
