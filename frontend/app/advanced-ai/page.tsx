'use client';

import Link from 'next/link';
import { useNodeProgress } from '../components/useNodeProgress';

const ADVANCED_DAYS: {
  day: number;
  topic: string;
  blurb: string;
  status: 'live' | 'planned';
}[] = [
  {
    day: 11,
    topic: 'Vector DB Landscape',
    blurb: 'FAISS, ChromaDB, Qdrant, Weaviate, Pinecone — embedded vs self-hosted vs managed.',
    status: 'live',
  },
  {
    day: 12,
    topic: 'ML Frameworks',
    blurb: 'PyTorch, TensorFlow / Keras, HuggingFace Hub + Transformers, ONNX — the stack underneath every modern LLM.',
    status: 'live',
  },
  {
    day: 13,
    topic: 'Cloud AI Platforms',
    blurb: 'AWS Bedrock, GCP Vertex, Azure OpenAI, Alibaba DashScope, Kaggle + Colab — the managed layer above the providers.',
    status: 'live',
  },
  {
    day: 14,
    topic: 'Local Model Inference',
    blurb: 'Ollama, vLLM, TGI, llama.cpp, LM Studio — run an LLM without a cloud bill, with PagedAttention + GGUF quantization visuals.',
    status: 'live',
  },
  {
    day: 15,
    topic: 'Observability & Evals',
    blurb: 'LangSmith, Langfuse, RAGAS, Weave, OpenTelemetry — trace every call, score every answer, with a live LLM-as-judge scorer.',
    status: 'live',
  },
  {
    day: 16,
    topic: 'LLM Frameworks',
    blurb: 'LCEL, LangChain Agents, LlamaIndex, LangGraph, CrewAI — five tabs, a framework picker, a ReAct stepper, and a stateful-graph walkthrough.',
    status: 'live',
  },
  {
    day: 17,
    topic: 'Production & Deployment',
    blurb: 'Docker multi-stage, GitHub Actions, blue/green deploys, and a live multi-provider cost estimator that shows where the money goes.',
    status: 'live',
  },
  {
    day: 18,
    topic: 'Advanced AI Topics',
    blurb: 'LoRA / QLoRA, RLHF, DPO, alignment, quantization — five concepts with a live deep-dive explainer that returns analogy + steps + why-it-matters.',
    status: 'live',
  },
  {
    day: 19,
    topic: 'AI Business & Products',
    blurb: 'Pricing matrix, GTM curves, demo-vs-production, responsible-AI checklist, case-study flip cards, and a live product critic that grades any idea.',
    status: 'live',
  },
  {
    day: 20,
    topic: 'Capstone — Build Your AI App',
    blurb: 'Five-toggle stack picker, architecture comparator, RAG pipeline walker, eval flywheel, and a 100-node constellation. The whole roadmap, end to end.',
    status: 'live',
  },
];

type BadgeState = 'completed' | 'live' | 'planned';

const COMPLETED_COLOR = '#1D9E75';

export default function AdvancedAIPage() {
  const progress = useNodeProgress();

  const dayProgress = (day: number) =>
    progress.data?.by_day.find((b) => b.day === day) ?? null;

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Advanced · Day 11–20
        </p>
        <h1 className="text-4xl font-semibold leading-tight">
          After the basics, the{' '}
          <span className="text-accent">production</span> stack.
        </h1>
        <p className="text-sm text-muted">
          Ten more days, fifty more nodes &mdash; vector engines, frameworks,
          local inference, evals, fine-tuning.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ADVANCED_DAYS.map((d) => {
          const live = d.status === 'live';
          const dp = dayProgress(d.day);
          const completed =
            live && dp !== null && dp.total > 0 && dp.done >= dp.total;
          const state: BadgeState = completed
            ? 'completed'
            : live
              ? 'live'
              : 'planned';

          const href = live ? `/advanced-ai/day-${d.day}` : null;

          const inner = (
            <div
              className={[
                'flex h-full flex-col gap-1.5 border bg-paper p-4 transition',
                completed
                  ? 'border-rule border-l-2 border-l-[#1D9E75] hover:border-[#1D9E75]'
                  : live
                    ? 'border-accent/40 hover:border-accent'
                    : 'border-rule opacity-70',
              ].join(' ')}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                  Day {d.day}
                </span>
                <DayBadge state={state} progress={dp} />
              </div>
              <h2 className="font-serif text-xl font-semibold">{d.topic}</h2>
              <p className="text-sm leading-relaxed text-foreground/80">
                {d.blurb}
              </p>
            </div>
          );
          if (!href) {
            return <li key={d.day}>{inner}</li>;
          }
          return (
            <li key={d.day}>
              <Link href={href} className="block h-full">
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function DayBadge({
  state,
  progress,
}: {
  state: BadgeState;
  progress: { done: number; total: number } | null;
}) {
  if (state === 'completed') {
    return (
      <span
        className="font-mono text-[10px] uppercase tracking-wide"
        style={{ color: COMPLETED_COLOR }}
      >
        ✓ completed
      </span>
    );
  }
  if (state === 'live') {
    return (
      <span className="font-mono text-[10px] uppercase tracking-wide text-accent">
        ✓ live
        {progress && progress.total > 0 && (
          <span className="ml-1 text-muted">
            · {progress.done}/{progress.total}
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
      planned
    </span>
  );
}
