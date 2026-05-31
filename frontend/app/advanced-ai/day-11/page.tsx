'use client';

import { useState } from 'react';
import ModelSwitcher from '../../components/ModelSwitcher';
import { Markdown } from '../../components/Markdown';
import { useNodeProgress } from '../../components/useNodeProgress';
import DayPager from '../../components/DayPager';

const NODES = [
  { id: 'N51', label: 'FAISS', title: 'FAISS' },
  { id: 'N52', label: 'ChromaDB', title: 'ChromaDB' },
  { id: 'N53', label: 'Qdrant', title: 'Qdrant' },
  { id: 'N54', label: 'Weaviate', title: 'Weaviate' },
  { id: 'N55', label: 'Pinecone', title: 'Pinecone + Compare' },
];

const VIZ = {
  green: '#1D9E75',
  blue: '#378ADD',
  violet: '#7F77DD',
  amber: '#FAC775',
  coral: '#F5C4B3',
  grey: '#9CA3AF',
} as const;

const ENGINE_COLOR: Record<string, string> = {
  FAISS: VIZ.blue,
  ChromaDB: VIZ.green,
  Qdrant: VIZ.violet,
  Weaviate: VIZ.amber,
  Pinecone: VIZ.coral,
};

const API = 'http://localhost:8000';

export default function Day11Page() {
  const [activeId, setActiveId] = useState('N51');
  const [provider, setProvider] = useState('openai');
  const progress = useNodeProgress(11);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 11 · Vector DB Landscape
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
          Five engines, one cosine.{' '}
          <span className="text-accent">Pick wisely.</span>
        </h1>
        <p className="text-sm text-muted">
          FAISS, ChromaDB, Qdrant, Weaviate, Pinecone &mdash; embedded,
          self-hosted, and managed. Each tab is N51&ndash;N55.
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

      <div className={activeId === 'N51' ? undefined : 'hidden'}>
        <NodeFAISS provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N52' ? undefined : 'hidden'}>
        <NodeChroma provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N53' ? undefined : 'hidden'}>
        <NodeQdrant provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N54' ? undefined : 'hidden'}>
        <NodeWeaviate provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N55' ? undefined : 'hidden'}>
        <NodePinecone provider={provider} setProvider={setProvider} />
      </div>
      <DayPager day={11} advanced />
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
  label = 'Generation provider',
}: {
  provider: string;
  setProvider: (p: string) => void;
  disabled: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-rule pb-3">
      <span className="font-mono text-xs uppercase tracking-wide text-muted">
        {label}
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
      const r = await fetch(`${API}/day11/ask`, {
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
        <textarea aria-label="Form input"
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

// ─── N51 — FAISS ─────────────────────────────────────────────────

function NodeFAISS({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="FAISS"
        hint="Facebook AI Similarity Search. An embedded library — no server, no SaaS, no cloud bill. You import it the same way you import numpy."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Born 2017"
          body="Open-sourced by Meta AI Research. The original go-to for academic similarity search."
          color={VIZ.blue}
        />
        <FactCard
          tag="Embedded"
          body="No daemon, no port. The index lives in your Python process. When the process dies, you lose the in-RAM index unless you persisted it to disk."
          color={VIZ.blue}
        />
        <FactCard
          tag="Three index types"
          body="Flat = brute force (exact, slow). IVF = inverted-file (clustered, faster). HNSW = navigable small-world graph (fastest, slight recall drop)."
          color={VIZ.blue}
        />
        <FactCard
          tag="No filters"
          body="No first-class metadata story. If you need 'top-k where category=blue', you filter in Python after retrieval — or you outgrew FAISS."
          color={VIZ.blue}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.blue}
        presets={[
          'When does FAISS stop being enough for production?',
          'How do IVF and HNSW indexes differ in practice?',
          'Can I use FAISS without storing the original text?',
        ]}
        defaultQuestion="When should I reach for FAISS instead of a hosted vector DB?"
      />
      <ExplainerBlock
        title="The 'just a library' superpower"
        body="FAISS has no network hops, no auth, no service to monitor. For ≤ a million vectors on a single box, it is hard to beat on latency. The catch is everything that comes with being just a library — no users-and-permissions, no cross-process sharing, no built-in persistence story beyond write-the-index-to-a-file."
      />
    </div>
  );
}

// ─── N52 — ChromaDB ──────────────────────────────────────────────

function NodeChroma({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="ChromaDB"
        hint="Embedded by default, persistent if you ask for it. The friendliest Python developer experience among the five — three lines to a working RAG demo."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="One-line setup"
          body="chromadb.Client() and you're up. Optional PersistentClient(path='…') for SQLite-backed durability."
          color={VIZ.green}
        />
        <FactCard
          tag="Metadata filters"
          body="Every document can carry a {key: value} dict, and queries can filter with where={'category': 'blog'}. Catches up to Qdrant/Weaviate for simple cases."
          color={VIZ.green}
        />
        <FactCard
          tag="Built-in embedder"
          body="If you don't supply embeddings, Chroma calls a default sentence-transformer for you. Trade-off: less control over which model is used."
          color={VIZ.green}
        />
        <FactCard
          tag="Scale ceiling"
          body="Designed for the laptop-to-small-server range. Past ~1-5M vectors with heavy filtering, you outgrow it — that's a Qdrant or Pinecone conversation."
          color={VIZ.green}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.green}
        presets={[
          'How is ChromaDB different from FAISS?',
          'When should I move off ChromaDB onto something heavier?',
          'How do metadata filters work in Chroma?',
        ]}
        defaultQuestion="What is ChromaDB best at, and where does it fall short?"
      />
      <ExplainerBlock
        title="The fastest path from notebook to RAG"
        body="If you are prototyping a RAG app and need 'just store these chunks and find similar ones', Chroma will save you a day of setup. The trade-off is the ceiling: when you need multi-tenant isolation, replication, or filters more complex than equality matches, you'll start eyeing the engines further down this list."
      />
    </div>
  );
}

// ─── N53 — Qdrant ────────────────────────────────────────────────

function NodeQdrant({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Qdrant"
        hint="Self-hosted by default, written in Rust. REST + gRPC. The sweet spot for teams who want production-grade filters and scale without Pinecone's price tag."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Rich payload filters"
          body="Range queries, geo filters, nested fields, boolean combinations. The filter engine is a first-class citizen, not an afterthought bolted onto vector search."
          color={VIZ.violet}
        />
        <FactCard
          tag="Single binary"
          body="One Rust executable. docker run -p 6333:6333 qdrant/qdrant and you're live. The same engine runs locally and in Qdrant Cloud."
          color={VIZ.violet}
        />
        <FactCard
          tag="HNSW + PQ"
          body="HNSW for low-latency retrieval, product quantization to compress vectors 4x-32x when RAM is tight. Quantization is opt-in per collection."
          color={VIZ.violet}
        />
        <FactCard
          tag="Managed option"
          body="Qdrant Cloud exists if you want the engine without the ops. Free tier covers small projects; you can lift-and-shift between local and cloud unchanged."
          color={VIZ.violet}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.violet}
        presets={[
          'When is Qdrant the right pick over Pinecone?',
          'What can Qdrant filters do that pgvector cannot?',
          'How do payload indexes affect query speed in Qdrant?',
        ]}
        defaultQuestion="When should I choose Qdrant over the alternatives?"
      />
      <ExplainerBlock
        title="The pragmatic middle ground"
        body="Qdrant sits between 'just a library' (FAISS, Chroma) and 'fully hosted SaaS' (Pinecone, Weaviate Cloud). For most teams that need real filters, real scale, and want to avoid surprise bills, it is the default sensible choice — you trade some operational work for control and cost."
      />
    </div>
  );
}

// ─── N54 — Weaviate ──────────────────────────────────────────────

function NodeWeaviate({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Weaviate"
        hint="Hybrid search out of the box. Marries BM25 keyword search with vector search and lets you blend their scores with a single weight parameter."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Hybrid by default"
          body="Single query, two retrievers (BM25 + vector), one merged ranking. Tune alpha=0..1 to weight keyword vs semantic — 0.5 is often the right default."
          color={VIZ.amber}
        />
        <FactCard
          tag="Modular vectorizers"
          body="Pick a vectorizer module (OpenAI, Cohere, transformers, …) and Weaviate handles embedding for you on insert and query. Or bring your own vectors."
          color={VIZ.amber}
        />
        <FactCard
          tag="GraphQL API"
          body="Queries look like { Get { Article(nearText: { concepts: ['rag'] }) { title } } }. Initially heavy, but expressive once it clicks."
          color={VIZ.amber}
        />
        <FactCard
          tag="Generative modules"
          body="Optional 'ask' and 'summarize' modules call an LLM on the retrieved chunks for you — a full mini-RAG primitive baked in."
          color={VIZ.amber}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.amber}
        presets={[
          'Why does hybrid search matter?',
          'When is Weaviate a better pick than Qdrant?',
          'How does BM25 blend with vector similarity?',
        ]}
        defaultQuestion="When is Weaviate a better choice than a pure vector DB?"
      />
      <ExplainerBlock
        title="When keywords still matter"
        body="Pure semantic search misses literal matches — drug names, SKUs, function signatures — that BM25 nails. If your domain has lots of named entities, abbreviations, or rare jargon, Weaviate's hybrid mode usually beats both pure-vector and pure-BM25 retrieval. It comes with more conceptual surface area than Qdrant, though, so the learning curve is steeper."
      />
    </div>
  );
}

// ─── N55 — Pinecone + Compare ────────────────────────────────────

function NodePinecone({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pinecone"
        hint="Fully managed, SaaS-only. You don't run anything — you pay for capacity, you get an API key, you make HTTP calls. The 'just make it go away' option."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Zero ops"
          body="No containers to run, no upgrades to schedule, no shards to balance. You get a REST endpoint and a Python SDK and you stop thinking about infra."
          color={VIZ.coral}
        />
        <FactCard
          tag="Serverless tier"
          body="Pay per request + per-stored-vector instead of running 24/7 pods. Great for spiky traffic; less great for steady high-QPS where pods are cheaper."
          color={VIZ.coral}
        />
        <FactCard
          tag="Real-time updates"
          body="Insert and query in the same query window — no rebuild step. Convenient for live document streams (chat logs, ticketing systems)."
          color={VIZ.coral}
        />
        <FactCard
          tag="Compliance built-in"
          body="SOC 2, HIPAA, GDPR controls available on enterprise tiers. The fastest path to a production launch when legal needs to sign off."
          color={VIZ.coral}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.coral}
        presets={[
          'When is Pinecone worth the price premium?',
          'Pinecone vs Qdrant Cloud — what is the actual difference?',
          'When does Pinecone serverless beat pod-based pricing?',
        ]}
        defaultQuestion="When does Pinecone make sense compared to running Qdrant ourselves?"
      />

      <ComparePanel provider={provider} setProvider={setProvider} />

      <ExplainerBlock
        title="Paying to skip the operations team"
        body="Pinecone exists for teams whose bottleneck isn't 'we don't know how to run a vector DB' — it's 'we don't want to hire someone to'. For a five-person product team that just needs RAG to ship, the bill is often cheaper than the on-call rotation it replaces. For a team with infra culture already, self-hosting Qdrant is usually the better trade."
      />
    </div>
  );
}

// ─── Compare panel ───────────────────────────────────────────────

type CompareEngine = {
  name: string;
  type: string;
  managed: number;
  filter_support: number;
  scale: number;
  cost_efficiency: number;
  setup_ease: number;
  best_for: string;
};

type CompareResponse = {
  engines: CompareEngine[];
  axes: string[];
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

const AXIS_LABEL: Record<string, string> = {
  managed: 'managed',
  filter_support: 'filters',
  scale: 'scale',
  cost_efficiency: 'cost',
  setup_ease: 'setup',
};

function ComparePanel({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day11/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as CompareResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">
            Compare all five engines
          </h3>
          <p className="mt-1 text-sm text-muted">
            Ask the model to rate each engine 1&ndash;5 on managed / filters
            / scale / cost / setup. Hand-drawn radar + matrix below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ModelSwitcher
            selected={provider}
            onChange={setProvider}
            disabled={loading}
          />
          <button
            onClick={run}
            disabled={loading}
            className="border border-foreground bg-foreground px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
          >
            {loading ? 'rating…' : 'Run compare →'}
          </button>
        </div>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
          <RadarChart engines={result.engines} axes={result.axes} />
          <FeatureMatrix engines={result.engines} axes={result.axes} />
        </div>
      )}
      {result && (
        <Footer>
          {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
          {result.latency_ms}ms
        </Footer>
      )}
    </div>
  );
}

function RadarChart({
  engines,
  axes,
}: {
  engines: CompareEngine[];
  axes: string[];
}) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 36;
  const n = axes.length;

  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const axisEnd = (i: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });
  const point = (i: number, score: number) => {
    const r = (radius * Math.max(0, Math.min(5, score))) / 5;
    return {
      x: cx + r * Math.cos(angle(i)),
      y: cy + r * Math.sin(angle(i)),
    };
  };

  const grid = [1, 2, 3, 4, 5];
  const RULE = '#3a3a3a';

  return (
    <div>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="block h-auto w-full"
        aria-label="Engine comparison radar chart"
      >
        {grid.map((g) => {
          const ringPts = Array.from({ length: n }, (_, i) => {
            const r = (radius * g) / 5;
            return `${cx + r * Math.cos(angle(i))},${
              cy + r * Math.sin(angle(i))
            }`;
          }).join(' ');
          return (
            <polygon
              key={g}
              points={ringPts}
              fill="none"
              stroke={RULE}
              strokeWidth={0.5}
            />
          );
        })}
        {axes.map((_, i) => {
          const end = axisEnd(i);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke={RULE}
              strokeWidth={0.5}
            />
          );
        })}
        {engines.map((e) => {
          const c = ENGINE_COLOR[e.name] ?? VIZ.grey;
          const pts = axes
            .map((axis, i) => {
              const score = (e[axis as keyof CompareEngine] as number) || 0;
              const p = point(i, score);
              return `${p.x},${p.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={e.name}
              points={pts}
              fill={c}
              fillOpacity={0.12}
              stroke={c}
              strokeWidth={1.5}
            />
          );
        })}
        {axes.map((axis, i) => {
          const end = axisEnd(i);
          const lx = cx + (radius + 14) * Math.cos(angle(i));
          const ly = cy + (radius + 14) * Math.sin(angle(i));
          let anchor: 'start' | 'middle' | 'end' = 'middle';
          if (end.x > cx + 5) anchor = 'start';
          else if (end.x < cx - 5) anchor = 'end';
          return (
            <text
              key={axis}
              x={lx}
              y={ly}
              fontSize={10}
              fill="#9CA3AF"
              textAnchor={anchor}
              dominantBaseline="middle"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {AXIS_LABEL[axis] ?? axis}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {engines.map((e) => (
          <span
            key={e.name}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-foreground/80"
          >
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5"
              style={{
                background: ENGINE_COLOR[e.name] ?? VIZ.grey,
                opacity: 0.7,
              }}
            />
            {e.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeatureMatrix({
  engines,
  axes,
}: {
  engines: CompareEngine[];
  axes: string[];
}) {
  return (
    <div className="overflow-x-auto border border-rule bg-paper">
      <table className="w-full border-collapse text-[13px]">
        <thead className="bg-paper/60">
          <tr>
            <th className="border-b border-rule px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              engine
            </th>
            <th className="border-b border-rule px-2 py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              type
            </th>
            {axes.map((a) => (
              <th
                key={a}
                className="border-b border-rule px-2 py-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
              >
                {AXIS_LABEL[a] ?? a}
              </th>
            ))}
            <th className="border-b border-rule px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              best for
            </th>
          </tr>
        </thead>
        <tbody>
          {engines.map((e) => (
            <tr key={e.name} className="border-t border-rule align-top">
              <td
                className="px-3 py-2 font-mono text-[12px]"
                style={{ color: ENGINE_COLOR[e.name] ?? VIZ.grey }}
              >
                {e.name}
              </td>
              <td className="px-2 py-2 text-[12px] text-muted">{e.type}</td>
              {axes.map((a) => {
                const score = (e[a as keyof CompareEngine] as number) || 0;
                return (
                  <td key={a} className="px-2 py-2 text-center">
                    <ScoreCell
                      score={score}
                      color={ENGINE_COLOR[e.name] ?? VIZ.grey}
                    />
                  </td>
                );
              })}
              <td className="px-3 py-2 text-[12px] text-foreground/85">
                {e.best_for}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreCell({ score, color }: { score: number; color: string }) {
  const dots = [1, 2, 3, 4, 5];
  return (
    <span
      className="inline-flex justify-center gap-0.5"
      aria-label={`${score} out of 5`}
    >
      {dots.map((d) => (
        <span
          key={d}
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: d <= score ? color : '#3a3a3a' }}
        />
      ))}
    </span>
  );
}
