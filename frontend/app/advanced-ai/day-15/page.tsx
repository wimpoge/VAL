'use client';

import { useEffect, useState } from 'react';
import ModelSwitcher from '../../components/ModelSwitcher';
import { Markdown } from '../../components/Markdown';
import { useNodeProgress } from '../../components/useNodeProgress';
import DayPager from '../../components/DayPager';

const NODES = [
  { id: 'N71', label: 'LangSmith', title: 'LangSmith' },
  { id: 'N72', label: 'Langfuse', title: 'Langfuse' },
  { id: 'N73', label: 'RAGAS', title: 'RAGAS + Eval Scorer' },
  { id: 'N74', label: 'Weave (W&B)', title: 'Weave (W&B)' },
  { id: 'N75', label: 'OpenTelemetry', title: 'OpenTelemetry for LLMs' },
];

const VIZ = {
  green: '#1D9E75',
  blue: '#378ADD',
  violet: '#7F77DD',
  amber: '#FAC775',
  coral: '#F5C4B3',
  red: '#E24B4A',
  grey: '#9CA3AF',
} as const;

const API = 'http://localhost:8000';

export default function Day15Page() {
  const [activeId, setActiveId] = useState('N71');
  const [provider, setProvider] = useState('openai');
  const progress = useNodeProgress(15);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 15 · Observability & Evals
          </p>
          {progress.dayProgress && (
            <span className="border border-rule bg-paper px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide">
              <span className="text-accent">{progress.dayProgress.done}</span>
              <span className="text-muted">
                {' '}
                / {progress.dayProgress.total} nodes
              </span>
            </span>
          )}
        </div>
        <h1 className="text-4xl font-semibold leading-tight">
          Trace every call,{' '}
          <span className="text-accent">score every answer</span>.
        </h1>
        <p className="text-sm text-muted">
          LangSmith, Langfuse, RAGAS, Weave, OpenTelemetry &mdash; how
          production AI teams catch regressions before users do. N71&ndash;N75.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {NODES.map((n) => {
          const active = n.id === activeId;
          const done = isDone(n.id);
          return (
            <button
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={[
                'flex items-center gap-1.5 border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition',
                active
                  ? 'border-accent bg-accent text-background'
                  : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex h-3.5 w-3.5 items-center justify-center border text-[9px] leading-none',
                  done
                    ? active
                      ? 'border-white bg-white text-accent'
                      : 'border-accent bg-accent text-background'
                    : active
                      ? 'border-white/60'
                      : 'border-rule',
                ].join(' ')}
                aria-hidden
              >
                {done ? '✓' : ''}
              </span>
              <span className="text-[10px] opacity-70">{n.id}</span>
              {n.label}
            </button>
          );
        })}
      </nav>

      <div className="flex justify-end">
        <button
          onClick={() => progress.toggle(activeId)}
          disabled={progress.toggling === activeId || progress.loading === true}
          className={[
            'flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition disabled:opacity-40',
            activeIsDone
              ? 'border-accent bg-accent text-background hover:bg-foreground hover:border-foreground'
              : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
          ].join(' ')}
          suppressHydrationWarning
        >
          <span aria-hidden>{activeIsDone ? '✓' : '○'}</span>
          {activeIsDone ? `${activeId} completed` : `mark ${activeId} complete`}
        </button>
      </div>

      <div className={activeId === 'N71' ? undefined : 'hidden'}>
        <NodeLangSmith provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N72' ? undefined : 'hidden'}>
        <NodeLangfuse provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N73' ? undefined : 'hidden'}>
        <NodeRAGAS provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N74' ? undefined : 'hidden'}>
        <NodeWeave provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N75' ? undefined : 'hidden'}>
        <NodeOTel provider={provider} setProvider={setProvider} />
      </div>
      <DayPager day={15} advanced />
    </article>
  );
}

// ─── shared blocks ───────────────────────────────────────────────

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <section className="space-y-1 border-l-2 border-accent pl-4">
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted">{hint}</p>
    </section>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="border-l-2 border-accent bg-paper px-4 py-3 text-sm text-accent">
      {message}
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-wide text-muted">
      {children}
    </p>
  );
}

function ExplainerBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-rule bg-paper/40 p-4">
      <h3 className="mb-1.5 font-serif text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-foreground/80">{body}</p>
    </div>
  );
}

function FactCard({
  tag,
  body,
  color,
}: {
  tag: string;
  body: string;
  color: string;
}) {
  return (
    <div
      className="space-y-1 border bg-paper p-3"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {tag}
      </div>
      <p className="text-[12px] leading-snug text-foreground/80">{body}</p>
    </div>
  );
}

function ProviderRow({
  provider,
  setProvider,
  disabled,
}: {
  provider: string;
  setProvider: (p: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-rule pb-3">
      <span className="font-mono text-xs uppercase tracking-wide text-muted">
        Generation provider
      </span>
      <ModelSwitcher
        selected={provider}
        onChange={setProvider}
        disabled={disabled}
      />
    </div>
  );
}

function SubmitButton({
  loading,
  idle,
  busy,
  disabled,
}: {
  loading: boolean;
  idle: string;
  busy: string;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="border border-foreground bg-foreground px-5 py-2 font-mono text-xs uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
    >
      {loading ? busy : idle}
    </button>
  );
}

// ─── shared Ask form ─────────────────────────────────────────────

type AskResponse = {
  question: string;
  answer: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

function AskBlock({
  presets,
  defaultQuestion,
  provider,
  setProvider,
  color,
}: {
  presets: string[];
  defaultQuestion: string;
  provider: string;
  setProvider: (p: string) => void;
  color: string;
}) {
  const [question, setQuestion] = useState(defaultQuestion);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day15/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as AskResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          setProvider={setProvider}
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuestion(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              preset {i + 1}
            </button>
          ))}
        </div>
        <textarea
          aria-label="Form input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          rows={2}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <SubmitButton
          loading={loading}
          idle="Ask the tutor →"
          busy="Thinking…"
          disabled={loading || !question.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}
      {result && (
        <div
          className="space-y-2 border border-rule bg-paper p-3"
          style={{ borderTop: `2px solid ${color}` }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color }}
          >
            answer
          </div>
          <div className="text-[14px] leading-relaxed text-foreground/90">
            <Markdown text={result.answer} />
          </div>
          <Footer>
            {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
            {result.latency_ms}ms
          </Footer>
        </div>
      )}
    </div>
  );
}

// ─── N71 — LangSmith + trace waterfall ───────────────────────────

function NodeLangSmith({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="LangSmith"
        hint="LangChain's own tracing + eval product. Drop in one env var on a LangChain app and every run, every chain step, every tool call shows up as a span you can click into. Tight integration with LangChain; works with raw API calls too."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Native to LangChain"
          body="Set LANGCHAIN_TRACING_V2=true + an API key and every chain/agent/retriever run is auto-traced. No code changes if you're already on LangChain."
          color={VIZ.blue}
        />
        <FactCard
          tag="Trace waterfall"
          body="Root chain expands into child spans: retriever, LLM call, parser. Each span shows latency, token counts, and the exact input/output payload at that step."
          color={VIZ.blue}
        />
        <FactCard
          tag="Datasets + evals"
          body="Save real traces into a dataset, then run evals (LLM-as-judge or custom code) against them on every PR. Catches regressions before deploy."
          color={VIZ.blue}
        />
        <FactCard
          tag="Hosted"
          body="Cloud SaaS by default (smith.langchain.com). Self-hosted available on the Plus plan — useful when production data can't leave your network."
          color={VIZ.blue}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.blue}
        presets={[
          'How does LangSmith differ from Langfuse?',
          'What is a span and why does it matter for debugging an agent?',
          'How do I run an offline eval against a saved LangSmith dataset?',
        ]}
        defaultQuestion="What is LangSmith and when should I reach for it?"
      />

      <TraceWaterfallVisual />

      <ExplainerBlock
        title="The LangChain-native option"
        body="If you're shipping a LangChain app, LangSmith is the path of least resistance. One env var unlocks traces; datasets + evals are a small step beyond that. The cost: it's a paid SaaS tied to the LangChain ecosystem. For non-LangChain apps or strict on-prem requirements, Langfuse or pure OpenTelemetry are the alternatives below."
      />
    </div>
  );
}

function TraceWaterfallVisual() {
  // Synthetic spans for a typical RAG chain. Latencies tuned to be visually
  // legible (LLM call dominates) and add up plausibly. The 'depth' field
  // determines indentation; children render to the right of the parent.
  const spans = [
    { name: 'rag_chain', kind: 'chain', ms: 1820, depth: 0, color: VIZ.blue },
    { name: 'retriever.invoke', kind: 'retriever', ms: 240, depth: 1, color: VIZ.green },
    { name: 'embed_query', kind: 'embedding', ms: 90, depth: 2, color: VIZ.violet },
    { name: 'pinecone.query', kind: 'vector_db', ms: 130, depth: 2, color: VIZ.violet },
    { name: 'llm.invoke', kind: 'llm', ms: 1450, depth: 1, color: VIZ.amber },
    { name: 'parser.parse', kind: 'parser', ms: 60, depth: 1, color: VIZ.coral },
  ];
  const total = Math.max(...spans.map((s) => s.ms));

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          What a trace looks like
        </h3>
        <p className="text-sm text-muted">
          A RAG chain expanded into spans. The LLM call dominates &mdash;
          almost always does, and that&apos;s the first thing you spot in any
          tracing UI.
        </p>
      </div>

      <div className="space-y-1.5 border border-rule bg-paper p-3 font-mono text-[11px]">
        {spans.map((s, i) => {
          const pct = (s.ms / total) * 100;
          return (
            <div
              key={i}
              className="flex items-center gap-2"
              style={{ paddingLeft: `${s.depth * 16}px` }}
            >
              <span className="w-32 shrink-0 truncate text-foreground/80">
                {s.name}
              </span>
              <span
                className="w-16 shrink-0 text-[10px] uppercase tracking-[0.12em]"
                style={{ color: s.color }}
              >
                {s.kind}
              </span>
              <div className="relative h-3 flex-1 bg-rule/60">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${pct}%`,
                    background: s.color,
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-foreground/70">
                {s.ms} ms
              </span>
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        Synthetic waterfall · real traces show payloads, errors, and nested
        sub-chains
      </p>
    </div>
  );
}

// ─── N72 — Langfuse + OTel pipeline ──────────────────────────────

function NodeLangfuse({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Langfuse"
        hint="Open-source observability for LLM apps. Self-hostable in Docker; cloud-managed if you don't want to run it. Framework-agnostic — works with LangChain, LlamaIndex, raw OpenAI SDK calls, and anything that speaks OTel."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="@observe decorator"
          body="Wrap any Python function with @observe() and it becomes a span. Nested calls auto-nest as child spans. Smallest possible instrumentation footprint."
          color={VIZ.green}
        />
        <FactCard
          tag="OpenAI drop-in"
          body="`from langfuse.openai import openai` patches the SDK. Every chat.completions.create() becomes a traced generation — no other code change needed."
          color={VIZ.green}
        />
        <FactCard
          tag="Self-hostable"
          body="docker compose up brings up Langfuse locally. PostgreSQL + ClickHouse under the hood. Useful when prod traces can't leave your network."
          color={VIZ.green}
        />
        <FactCard
          tag="Prompts + evals"
          body="Versioned prompt management, dataset runs, LLM-as-judge evaluators, and user feedback capture — all in the same UI as the traces."
          color={VIZ.green}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.green}
        presets={[
          'How do I trace a raw OpenAI app with Langfuse?',
          'Should I self-host Langfuse or use the cloud?',
          'How does Langfuse compare to LangSmith for non-LangChain apps?',
        ]}
        defaultQuestion="What is Langfuse and what does the @observe decorator do?"
      />

      <LangfusePipelineVisual />

      <ExplainerBlock
        title="The framework-agnostic option"
        body="Langfuse&apos;s pitch is that you don&apos;t have to commit to LangChain to get LangSmith-style traces. The @observe decorator works on any Python function; the OpenAI drop-in patches the SDK. If you self-host, you also dodge the &ldquo;our traces are now somebody else&apos;s logs&rdquo; problem. The trade: you run the infra (Postgres + ClickHouse) when self-hosted."
      />
    </div>
  );
}

function LangfusePipelineVisual() {
  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          How traces reach the dashboard
        </h3>
        <p className="text-sm text-muted">
          Two entry points, one dashboard. Both wind up as spans in the same
          Langfuse project.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2 border border-rule bg-paper p-3">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.green }}
          >
            Path A · decorator
          </div>
          <PipelineRow label="Your app code" color={VIZ.coral} />
          <PipelineArrow />
          <PipelineRow label="@observe()" color={VIZ.green} mono />
          <PipelineArrow />
          <PipelineRow label="Langfuse SDK" color={VIZ.green} />
          <PipelineArrow />
          <PipelineRow label="Langfuse dashboard" color={VIZ.blue} />
        </div>
        <div className="space-y-2 border border-rule bg-paper p-3">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.green }}
          >
            Path B · OpenAI proxy
          </div>
          <PipelineRow label="Your app code" color={VIZ.coral} />
          <PipelineArrow />
          <PipelineRow
            label="from langfuse.openai import openai"
            color={VIZ.amber}
            mono
          />
          <PipelineArrow />
          <PipelineRow label="OpenAI SDK (patched)" color={VIZ.violet} />
          <PipelineArrow />
          <PipelineRow label="Langfuse dashboard" color={VIZ.blue} />
        </div>
      </div>
    </div>
  );
}

function PipelineRow({
  label,
  color,
  mono,
}: {
  label: string;
  color: string;
  mono?: boolean;
}) {
  return (
    <div
      className={[
        'border bg-paper px-3 py-1.5 text-center text-[12px]',
        mono ? 'font-mono text-[11px]' : '',
      ].join(' ')}
      style={{ borderLeft: `2px solid ${color}` }}
    >
      {label}
    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="text-center font-mono text-[10px] text-muted">↓</div>
  );
}

// ─── N73 — RAGAS + LLM-as-judge eval scorer (the big one) ────────

function NodeRAGAS({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="RAGAS"
        hint="Reference metrics for RAG. Faithfulness, answer relevancy, context precision, context recall — each one a 0-to-1 score computed by an LLM-as-judge against your question + retrieved context + generated answer."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="LLM-as-judge"
          body="A second LLM call scores the first one. Cheap, fast, surprisingly well-calibrated for relative comparisons — but biased toward verbosity, so prefer ranked deltas over absolute thresholds."
          color={VIZ.violet}
        />
        <FactCard
          tag="No ground truth needed"
          body="Faithfulness + answer relevancy + context precision can be scored from just the (question, context, answer) triple. Context recall does need a reference answer."
          color={VIZ.violet}
        />
        <FactCard
          tag="Plays with Langfuse + LangSmith"
          body="RAGAS computes the score; the observability tool stores it next to the trace. You get a chart of faithfulness over time and can sort failed traces by metric."
          color={VIZ.violet}
        />
        <FactCard
          tag="The unit test of RAG"
          body="Build a small dataset of (question, expected_context) pairs and re-run RAGAS on every prompt or retrieval change. The metrics tell you whether you regressed."
          color={VIZ.violet}
        />
      </div>

      <RagasMetricGrid />

      <EvalScorerForm provider={provider} setProvider={setProvider} />

      <ExplainerBlock
        title="The eval that scales"
        body="Human eval is the gold standard and the bottleneck. RAGAS-style LLM-as-judge metrics are the practical workhorse: you accept a small calibration penalty in exchange for being able to score 10,000 traces in an afternoon. The trick is to use them as a continuous regression signal, not an absolute quality bar. If faithfulness drops from 0.81 to 0.62 after a prompt change, that&apos;s the thing to investigate — not the absolute number."
      />
    </div>
  );
}

const RAGAS_CARDS: {
  name: string;
  blurb: string;
  status: 'live' | 'soon';
}[] = [
  {
    name: 'Faithfulness',
    blurb:
      'Is every claim in the answer grounded in the retrieved context? Hallucinations drop this fastest.',
    status: 'live',
  },
  {
    name: 'Answer relevancy',
    blurb:
      'Does the answer actually address the question? Off-topic or dodging responses score low.',
    status: 'live',
  },
  {
    name: 'Context precision',
    blurb:
      'Does the retrieved context contain what is needed? Noisy / off-topic chunks pull this down.',
    status: 'live',
  },
  {
    name: 'Context recall',
    blurb:
      'Did retrieval find everything needed? Needs a reference answer — not available in this demo.',
    status: 'soon',
  },
];

function RagasMetricGrid() {
  return (
    <div className="space-y-3 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The four core metrics
        </h3>
        <p className="text-sm text-muted">
          Three of these get scored by the demo below. Context recall is grayed
          out because it needs a reference answer the form doesn&apos;t collect.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {RAGAS_CARDS.map((c) => {
          const live = c.status === 'live';
          return (
            <div
              key={c.name}
              className={[
                'border bg-paper p-3 space-y-1',
                live ? '' : 'opacity-50',
              ].join(' ')}
              style={{
                borderLeft: `2px solid ${live ? VIZ.violet : VIZ.grey}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="font-serif text-base font-semibold">
                  {c.name}
                </div>
                {!live && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                    coming soon
                  </span>
                )}
              </div>
              <p className="text-[12px] leading-snug text-foreground/80">
                {c.blurb}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type EvalResponse = {
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  explanation: string;
  verdict: 'pass' | 'warn' | 'fail';
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

const EVAL_PRESETS: { label: string; question: string; context: string; answer: string }[] = [
  {
    label: 'Clean RAG',
    question: 'What is PagedAttention?',
    context:
      'PagedAttention is a memory management technique introduced by vLLM. ' +
      'It splits the KV cache into small fixed-size blocks (pages) and ' +
      'allocates them on demand rather than reserving a worst-case slab ' +
      'per request. This lets a single GPU serve 2-5x more concurrent ' +
      'requests than naive transformer inference.',
    answer:
      'PagedAttention is a vLLM memory technique that splits the KV cache ' +
      'into small blocks and allocates them on demand. This lets one GPU ' +
      'handle 2-5x more concurrent requests than a naive serving setup.',
  },
  {
    label: 'Hallucinated',
    question: 'When was Langfuse founded?',
    context:
      'Langfuse is an open-source observability platform for LLM apps. ' +
      'It can be self-hosted via Docker or used as a cloud SaaS. The ' +
      'project supports Python and JS/TS SDKs.',
    answer:
      'Langfuse was founded in 2018 in San Francisco by a team of ' +
      'ex-Google engineers and has raised $50M in Series B funding.',
  },
  {
    label: 'Off-topic context',
    question: 'How do I run a 7B model on 8 GB of RAM?',
    context:
      'FAISS is a vector similarity library from Meta. It supports flat, ' +
      'IVF, and HNSW indexes. Most users start with IndexFlatL2 and move ' +
      'to IVF or HNSW once corpora exceed a million vectors.',
    answer:
      'You can run a 7B model on 8 GB of RAM by using INT4 quantization ' +
      'with llama.cpp or Ollama. The model file is around 4 GB at Q4.',
  },
];

function EvalScorerForm({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  const [question, setQuestion] = useState(EVAL_PRESETS[0].question);
  const [context, setContext] = useState(EVAL_PRESETS[0].context);
  const [answer, setAnswer] = useState(EVAL_PRESETS[0].answer);
  const [result, setResult] = useState<EvalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreset = (i: number) => {
    const p = EVAL_PRESETS[i];
    setQuestion(p.question);
    setContext(p.context);
    setAnswer(p.answer);
    setResult(null);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !context.trim() || !answer.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day15/eval-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context, answer, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as EvalResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Try the LLM-as-judge scorer
        </h3>
        <p className="text-sm text-muted">
          Paste a question, the context you fed your model, and the answer it
          produced. The judge model scores it on the three RAGAS metrics that
          don&apos;t need a reference answer.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          setProvider={setProvider}
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          {EVAL_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => loadPreset(i)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
            htmlFor="eval-question"
          >
            Question
          </label>
          <input
            id="eval-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            className="w-full border border-rule bg-paper p-2 text-sm leading-relaxed outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
            htmlFor="eval-context"
          >
            Context · what your retriever returned
          </label>
          <textarea
            id="eval-context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={loading}
            rows={4}
            placeholder="Paste the retrieved context here"
            className="w-full border border-rule bg-paper p-2 text-sm leading-relaxed outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
            htmlFor="eval-answer"
          >
            Answer · what your model produced
          </label>
          <textarea
            id="eval-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={loading}
            rows={3}
            placeholder="Paste the LLM answer to evaluate"
            className="w-full border border-rule bg-paper p-2 text-sm leading-relaxed outline-none focus:border-accent"
          />
        </div>

        <SubmitButton
          loading={loading}
          idle="Score this answer →"
          busy="Judging…"
          disabled={
            loading || !question.trim() || !context.trim() || !answer.trim()
          }
        />
      </form>

      {error && <ErrorBox message={error} />}
      {result && <EvalResultBlock result={result} />}
    </div>
  );
}

function EvalResultBlock({ result }: { result: EvalResponse }) {
  return (
    <div className="space-y-4">
      <VerdictBanner verdict={result.verdict} />
      <div className="space-y-3 border border-rule bg-paper p-4">
        <ScoreBar
          name="Faithfulness"
          tooltip="Is every claim in the answer grounded in the context?"
          score={result.faithfulness}
        />
        <ScoreBar
          name="Answer relevancy"
          tooltip="Does the answer directly address the question?"
          score={result.answer_relevancy}
        />
        <ScoreBar
          name="Context precision"
          tooltip="Does the context contain what is needed to answer?"
          score={result.context_precision}
        />
      </div>
      {result.explanation && (
        <div
          className="border border-rule bg-paper p-4"
          style={{ borderLeft: `2px solid ${VIZ.violet}` }}
        >
          <div
            className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.violet }}
          >
            Judge explanation
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">
            {result.explanation}
          </p>
        </div>
      )}
      <Footer>
        {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
        {result.latency_ms}ms
      </Footer>
    </div>
  );
}

function VerdictBanner({ verdict }: { verdict: 'pass' | 'warn' | 'fail' }) {
  const config = {
    pass: { color: VIZ.green, label: '✓ Looks good' },
    warn: { color: VIZ.amber, label: '⚠ Review needed' },
    fail: { color: VIZ.red, label: '✗ Needs improvement' },
  }[verdict];
  return (
    <div
      className="border-l-2 px-4 py-3 text-sm font-semibold"
      style={{
        borderColor: config.color,
        color: config.color,
        background: `${config.color}1A`,
      }}
    >
      {config.label}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 0.7) return VIZ.green;
  if (score >= 0.4) return VIZ.amber;
  return VIZ.red;
}

function ScoreBar({
  name,
  tooltip,
  score,
}: {
  name: string;
  tooltip: string;
  score: number;
}) {
  // Animate from 0 to the real score after mount so the bar visibly grows.
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(score));
    return () => cancelAnimationFrame(id);
  }, [score]);
  const color = scoreColor(score);
  return (
    <div className="space-y-1" title={tooltip}>
      <div className="flex items-baseline justify-between text-[12px]">
        <span className="text-foreground/85">{name}</span>
        <span className="font-mono" style={{ color }}>
          {score.toFixed(2)}
        </span>
      </div>
      <div className="relative h-2 bg-rule/60">
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
          style={{
            width: `${animated * 100}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

// ─── N74 — Weave (W&B) ───────────────────────────────────────────

function NodeWeave({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Weave (W&B)"
        hint="Weights & Biases' answer to LLM observability. The trick: traces, experiments, and model registries all live in the same project, so you can hop from a production trace back to the run that produced the model."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="One project, two phases"
          body="Training runs (W&B Experiments) and inference traces (Weave) sit in the same project view. Click a trace → jump to the run → see the loss curve that produced this model."
          color={VIZ.amber}
        />
        <FactCard
          tag="@weave.op decorator"
          body="Wrap a function with @weave.op and every call is logged with inputs, outputs, latency, and any nested calls. Same instrumentation story as Langfuse's @observe."
          color={VIZ.amber}
        />
        <FactCard
          tag="Datasets + evaluations"
          body="weave.Evaluation pairs a dataset with one or more scorers (LLM-judge or code). Re-run on every change and compare versions side by side."
          color={VIZ.amber}
        />
        <FactCard
          tag="W&B-native shop fit"
          body="If your training already lives in W&B, Weave is the no-friction extension. If you're not a W&B shop, Langfuse or LangSmith are usually less commitment."
          color={VIZ.amber}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.amber}
        presets={[
          'How is Weave different from W&B Experiments?',
          'When is Weave a better pick than Langfuse?',
          'How do I run a weave.Evaluation?',
        ]}
        defaultQuestion="What does Weave give me that LangSmith or Langfuse don't?"
      />

      <TrainToTraceTimelineVisual />

      <ExplainerBlock
        title="The training-aware option"
        body="Most observability tools treat inference as the whole story. Weave's edge is keeping a thread back to the training run: the same project that has the loss curves also has the production traces. If you're fine-tuning your own models (Day 18), that thread starts to matter — you want to know which run produced the model that's failing in prod. If you're only calling closed APIs, the connection adds less."
      />
    </div>
  );
}

function TrainToTraceTimelineVisual() {
  // Stylized timeline showing two phases of a project: training runs that
  // converge to a deployed model, then inference traces that flow from it.
  const trainRuns = [
    { label: 'run #1', y: 70, color: VIZ.coral },
    { label: 'run #2', y: 55, color: VIZ.coral },
    { label: 'run #3', y: 35, color: VIZ.coral },
    { label: 'run #4 (best)', y: 20, color: VIZ.green },
  ];
  const traces = [
    { label: 't+1d', height: 30 },
    { label: 't+3d', height: 50 },
    { label: 't+7d', height: 45 },
    { label: 't+14d', height: 60 },
  ];

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Training runs → deployed model → production traces
        </h3>
        <p className="text-sm text-muted">
          Two phases on one timeline. The handoff is the model artifact that
          becomes the prod endpoint.
        </p>
      </div>

      <div className="border border-rule bg-paper p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: VIZ.coral }}
            >
              Phase 1 · training (W&B Experiments)
            </div>
            <div className="relative h-24 border border-rule bg-background/40">
              {trainRuns.map((r, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${(i + 0.5) * (100 / trainRuns.length)}%`,
                    top: `${r.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: r.color }}
                  />
                  <div
                    className="mt-1 whitespace-nowrap font-mono text-[9px]"
                    style={{ color: r.color }}
                  >
                    {r.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Loss ↓ across runs
            </p>
          </div>

          <div className="space-y-2">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: VIZ.amber }}
            >
              Phase 2 · inference (Weave)
            </div>
            <div className="relative flex h-24 items-end gap-2 border border-rule bg-background/40 p-2">
              {traces.map((t, i) => (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full"
                    style={{
                      height: `${t.height}%`,
                      background: VIZ.amber,
                      opacity: 0.85,
                    }}
                  />
                  <div className="font-mono text-[9px] text-muted">
                    {t.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Traces per day ↑
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          <span style={{ color: VIZ.green }}>run #4</span>
          <span>→</span>
          <span style={{ color: VIZ.blue }}>deployed model</span>
          <span>→</span>
          <span style={{ color: VIZ.amber }}>production traces</span>
        </div>
      </div>
    </div>
  );
}

// ─── N75 — OpenTelemetry for LLMs ────────────────────────────────

function NodeOTel({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="OpenTelemetry for LLMs"
        hint="The escape hatch. Instrument once with OTel + the gen_ai semantic conventions and you can send the same traces to Langfuse, LangSmith, Grafana, Honeycomb, or any OTLP-speaking backend. Vendor-neutral by design."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="One instrumentation"
          body="opentelemetry-instrumentation-openai (and friends) auto-instrument the SDK. You add the OTel SDK once; switching backends later is just an exporter swap."
          color={VIZ.coral}
        />
        <FactCard
          tag="gen_ai semantic conventions"
          body="OTel defines standard span attribute names for LLM calls: gen_ai.system, gen_ai.request.model, gen_ai.usage.input_tokens, etc. Backends can speak a common dialect."
          color={VIZ.coral}
        />
        <FactCard
          tag="Multi-backend fan-out"
          body="Configure two exporters and the same span goes to both. Use Langfuse for product debugging and Grafana for SRE-style dashboards from the same source of truth."
          color={VIZ.coral}
        />
        <FactCard
          tag="Future-proof"
          body="LLM tooling churns fast. OTel is the layer that survives — picking a backend later doesn't require re-instrumenting your app."
          color={VIZ.coral}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.coral}
        presets={[
          'What are the gen_ai semantic conventions in OpenTelemetry?',
          'How do I send the same LLM traces to Langfuse and Grafana?',
          'When should I use raw OTel instead of Langfuse or LangSmith directly?',
        ]}
        defaultQuestion="What does OpenTelemetry give me for LLM apps?"
      />

      <OTelFanoutVisual />

      <ExplainerBlock
        title="The lock-in escape hatch"
        body="If you don&apos;t know yet which observability backend you&apos;ll standardize on, OTel is the bet that buys time. The cost is one layer of indirection: you ship spans through OTLP, not directly to a vendor SDK. The upside is that switching from LangSmith to Langfuse — or splitting prod traces between Honeycomb and Langfuse — is a config change, not a rewrite. For mature platforms, OTel is increasingly the default; the vendor SDKs are becoming thin wrappers over it."
      />
    </div>
  );
}

function OTelFanoutVisual() {
  const attrs = [
    'gen_ai.system',
    'gen_ai.request.model',
    'gen_ai.usage.input_tokens',
    'gen_ai.usage.output_tokens',
    'gen_ai.response.id',
  ];
  const backends = [
    { name: 'Langfuse', color: VIZ.green },
    { name: 'Grafana', color: VIZ.amber },
    { name: 'Honeycomb', color: VIZ.coral },
    { name: 'LangSmith', color: VIZ.blue },
  ];
  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          One SDK, many backends
        </h3>
        <p className="text-sm text-muted">
          The OTel SDK emits spans; OTLP exporters fan them out to whichever
          backends you configure. Same data, parallel destinations.
        </p>
      </div>

      <div className="space-y-4 border border-rule bg-paper p-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {attrs.map((a) => (
            <span
              key={a}
              className="border px-2 py-0.5 font-mono text-[10px]"
              style={{
                borderColor: VIZ.coral,
                color: VIZ.coral,
                background: `${VIZ.coral}1A`,
              }}
            >
              {a}
            </span>
          ))}
        </div>

        <div
          className="mx-auto w-fit border bg-background px-4 py-1.5 text-center font-mono text-[11px]"
          style={{ borderColor: VIZ.coral, color: VIZ.coral }}
        >
          OTel SDK · OTLP exporter
        </div>

        <div className="text-center font-mono text-[10px] text-muted">
          ↙ ↓ ↓ ↘
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {backends.map((b) => (
            <div
              key={b.name}
              className="border bg-paper px-3 py-2 text-center font-mono text-[11px]"
              style={{
                borderColor: b.color,
                color: b.color,
                background: `${b.color}14`,
              }}
            >
              {b.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
