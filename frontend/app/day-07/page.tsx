'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNodeProgress } from '../components/useNodeProgress';
import DayPager from '../components/DayPager';

const NODES = [
  { id: 'N31', label: 'What is a DB', title: 'What are vector DBs?' },
  { id: 'N32', label: 'Embed models', title: 'Embedding models' },
  { id: 'N33', label: 'Platforms', title: 'pgvector / Pinecone / Weaviate' },
  { id: 'N34', label: 'Indexing', title: 'Indexing embeddings' },
  { id: 'N35', label: 'Search', title: 'Similarity search' },
];

const VIZ = {
  green: '#1D9E75',
  blue: '#378ADD',
  violet: '#7F77DD',
  amber: '#FAC775',
  coral: '#F5C4B3',
} as const;

const API = 'http://localhost:8000';
const EMBED_BADGE = 'openai · text-embedding-3-small';

type Doc = { id: string; text: string; has_embedding: boolean };

export default function Day07Page() {
  const [activeId, setActiveId] = useState('N31');
  const progress = useNodeProgress(7);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [docsLoading, setDocsLoading] = useState(true);

  const refreshDocs = useCallback(async () => {
    setDocsLoading(true);
    setDocsError(null);
    try {
      const r = await fetch(`${API}/day07/documents`);
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      const json = (await r.json()) as { documents: Doc[]; count: number };
      setDocs(json.documents);
    } catch (e) {
      setDocsError(e instanceof Error ? e.message : String(e));
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API}/day07/documents`);
        if (cancelled) return;
        if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
        const json = (await r.json()) as { documents: Doc[]; count: number };
        if (!cancelled) setDocs(json.documents);
      } catch (e) {
        if (!cancelled) {
          setDocsError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const deleteDoc = useCallback(
    async (id: string) => {
      try {
        const r = await fetch(
          `${API}/day07/documents/${encodeURIComponent(id)}`,
          { method: 'DELETE' },
        );
        if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
        await refreshDocs();
      } catch (e) {
        setDocsError(e instanceof Error ? e.message : String(e));
      }
    },
    [refreshDocs],
  );

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 07 · Vector Databases
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
          Vectors get a <span className="text-accent">home</span>.
        </h1>
        <p className="text-sm text-muted">
          Store embeddings in Postgres + pgvector, query by cosine distance,
          watch real rows return. Each tab is N31–N35.
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

      <div className={activeId === 'N31' ? undefined : 'hidden'}>
        <NodeWhatIs
          docs={docs}
          docsLoading={docsLoading}
          docsError={docsError}
          refreshDocs={refreshDocs}
        />
      </div>
      <div className={activeId === 'N32' ? undefined : 'hidden'}>
        <NodeEmbedModels />
      </div>
      <div className={activeId === 'N33' ? undefined : 'hidden'}>
        <NodePlatforms />
      </div>
      <div className={activeId === 'N34' ? undefined : 'hidden'}>
        <NodeIngest
          docs={docs}
          docsLoading={docsLoading}
          docsError={docsError}
          refreshDocs={refreshDocs}
          deleteDoc={deleteDoc}
        />
      </div>
      <div className={activeId === 'N35' ? undefined : 'hidden'}>
        <NodeSearch docCount={docs.length} />
      </div>
      <DayPager day={7} />
    </article>
  );
}

// ─── shared helpers ───────────────────────────────────────────────

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

function StaticEmbedBadge() {
  return (
    <div className="flex items-center justify-between border-b border-rule pb-3">
      <span className="font-mono text-xs uppercase tracking-wide text-muted">
        Embedding model
      </span>
      <span
        className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
        style={{
          borderColor: VIZ.green,
          color: VIZ.green,
          background: `${VIZ.green}1F`,
        }}
      >
        {EMBED_BADGE}
      </span>
    </div>
  );
}

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[6px] w-full bg-rule">
      <div
        className="h-full"
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: color,
          transition: 'width 500ms ease-out',
        }}
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

function DocList({
  docs,
  docsLoading,
  docsError,
  refreshDocs,
  onDelete,
}: {
  docs: Doc[];
  docsLoading: boolean;
  docsError: string | null;
  refreshDocs: () => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Currently stored — {docsLoading ? '…' : `${docs.length} docs`}
        </div>
        <button
          type="button"
          onClick={refreshDocs}
          className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground"
        >
          refresh
        </button>
      </div>
      {docsError && <ErrorBox message={docsError} />}
      {!docsError && docs.length === 0 && !docsLoading && (
        <p className="border border-rule border-dashed bg-paper/40 p-3 text-[13px] text-muted">
          The documents table is empty. Use N34 Indexing to add some.
        </p>
      )}
      {docs.length > 0 && (
        <ul className="space-y-1.5">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-start gap-2 border border-rule bg-paper p-2.5"
            >
              <span
                className="shrink-0 font-mono text-[11px] uppercase tracking-wide"
                style={{ color: VIZ.violet }}
              >
                {d.id}
              </span>
              <span className="flex-1 text-[13px] text-foreground/85">
                {d.text}
              </span>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(d.id)}
                  className="shrink-0 font-mono text-[11px] text-muted transition hover:text-accent"
                  aria-label={`delete ${d.id}`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── N31 — What are vector DBs? ───────────────────────────────────

const PIPELINE_STEPS: { label: string; sub: string; color: string }[] = [
  { label: '1 · Text', sub: 'a sentence, a paragraph, a chunk', color: VIZ.green },
  { label: '2 · Embed', sub: 'OpenAI → 1536-dim float vector', color: VIZ.blue },
  { label: '3 · Store', sub: 'row in Postgres with a vector column', color: VIZ.violet },
  { label: '4 · Query', sub: 'cosine distance against query vector', color: VIZ.amber },
  { label: '5 · Rank', sub: 'nearest rows come back first', color: VIZ.coral },
];

function NodeWhatIs({
  docs,
  docsLoading,
  docsError,
  refreshDocs,
}: {
  docs: Doc[];
  docsLoading: boolean;
  docsError: string | null;
  refreshDocs: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="What are vector DBs?"
        hint="A normal database asks 'where is row X?'. A vector database asks 'which rows mean something close to this?'. It stores embeddings and indexes them for fast nearest-neighbour search."
      />

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          The five-step pipeline
        </div>
        <ol className="grid grid-cols-1 gap-2 md:grid-cols-5">
          {PIPELINE_STEPS.map((s) => (
            <li
              key={s.label}
              className="space-y-1 border bg-paper p-3"
              style={{ borderLeft: `2px solid ${s.color}` }}
            >
              <div
                className="font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: s.color }}
              >
                {s.label}
              </div>
              <p className="text-[12px] leading-snug text-foreground/80">{s.sub}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-rule pt-6">
        <DocList
          docs={docs}
          docsLoading={docsLoading}
          docsError={docsError}
          refreshDocs={refreshDocs}
        />
      </div>

      <ExplainerBlock
        title="A SQL row + a vector column"
        body="Under the hood this app uses a regular Postgres table named documents with three columns: id, text, and embedding vector(1536). The vector column is what the pgvector extension adds — it stores the 1536 floats per row and exposes operators like <=> (cosine distance) so you can ORDER BY closeness in plain SQL. The 'database' part of vector database is not magic; the 'vector' part is."
      />
    </div>
  );
}

// ─── N32 — Embedding models ───────────────────────────────────────

type EmbedModelCard = {
  name: string;
  vendor: string;
  dims: string;
  pricing: string;
  access: string;
  note: string;
  highlight?: boolean;
};

const EMBED_MODELS: EmbedModelCard[] = [
  {
    name: 'text-embedding-3-small',
    vendor: 'OpenAI',
    dims: '1536',
    pricing: '$0.02 / 1M tokens',
    access: 'API only',
    note: 'Default in this app. Cheap, high quality, the safe pick when you do not have a strong reason to use something else.',
    highlight: true,
  },
  {
    name: 'text-embedding-3-large',
    vendor: 'OpenAI',
    dims: '3072',
    pricing: '$0.13 / 1M tokens',
    access: 'API only',
    note: 'Higher quality, ~6× the price and 2× the dimensions. Worth it when retrieval quality is the bottleneck.',
  },
  {
    name: 'embed-multilingual-v3',
    vendor: 'Cohere',
    dims: '1024',
    pricing: '$0.10 / 1M tokens',
    access: 'API only',
    note: 'Strong multilingual retrieval out of the box. Pick when your corpus is not English.',
  },
  {
    name: 'all-MiniLM-L6-v2',
    vendor: 'Sentence Transformers',
    dims: '384',
    pricing: 'Free (self-hosted)',
    access: 'Open weights, run locally',
    note: 'Tiny, fast, runs on CPU. Quality lower than the big APIs but unbeatable when you cannot send data to a vendor.',
  },
];

function NodeEmbedModels() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Embedding models"
        hint="Different embedding models produce different vectors — different dimensions, different price points, different licenses. They are all interchangeable at the math level but you cannot mix them in the same index."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {EMBED_MODELS.map((m) => {
          const color = m.highlight ? VIZ.green : VIZ.blue;
          return (
            <div
              key={m.name}
              className="space-y-2 border bg-paper p-4"
              style={{
                borderColor: m.highlight ? color : 'var(--rule)',
                borderLeftWidth: 2,
                borderLeftColor: color,
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color }}
                >
                  {m.vendor}
                </div>
                {m.highlight && (
                  <span
                    className="border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide"
                    style={{
                      borderColor: color,
                      color,
                      background: `${color}1F`,
                    }}
                  >
                    used here
                  </span>
                )}
              </div>
              <div className="font-serif text-base font-semibold">{m.name}</div>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-0.5 text-[12px] sm:grid-cols-3">
                <CardRow k="Dims" v={m.dims} />
                <CardRow k="Pricing" v={m.pricing} />
                <CardRow k="Access" v={m.access} />
              </dl>
              <p className="pt-1 text-[13px] leading-relaxed text-foreground/80">
                {m.note}
              </p>
            </div>
          );
        })}
      </div>

      <ExplainerBlock
        title="Pick one and commit"
        body="Every embedding model lives in its own coordinate system, so vectors from one model are meaningless to another. Once you index a corpus with text-embedding-3-small, every query and every new document must also use text-embedding-3-small — switching means re-embedding everything you have. Choose based on language, privacy, budget, and quality before you start filling rows."
      />
    </div>
  );
}

function CardRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted">
        {k}
      </dt>
      <dd className="text-foreground/85">{v}</dd>
    </div>
  );
}

// ─── N33 — Platforms ──────────────────────────────────────────────

type PlatformCard = {
  name: string;
  hosting: string;
  license: string;
  why: string;
  highlight?: boolean;
};

const PLATFORMS: PlatformCard[] = [
  {
    name: 'pgvector',
    hosting: 'Postgres extension — self-host or any managed Postgres',
    license: 'Open source (PostgreSQL license)',
    why: 'Used in this app. Your vectors live next to your relational data, in the database you already operate. Cheap, ACID, and you query them with plain SQL.',
    highlight: true,
  },
  {
    name: 'Pinecone',
    hosting: 'Managed SaaS only',
    license: 'Commercial',
    why: 'Zero ops, fast, scales to billions of vectors. Pay-per-use. Pick when you do not want to run any infrastructure and your data can leave your network.',
  },
  {
    name: 'Weaviate',
    hosting: 'Self-host or managed cloud',
    license: 'Open source (BSD-3)',
    why: 'Hybrid search out of the box (vector + keyword), strong modular ecosystem. Heavier than pgvector but lighter than running a real distributed cluster.',
  },
  {
    name: 'Qdrant / Milvus / Chroma',
    hosting: 'Various — open source + managed',
    license: 'Mostly Apache-2',
    why: 'Other strong open-source choices. Each has different sweet spots (Qdrant for filters, Milvus for scale, Chroma for local dev). Worth knowing they exist.',
  },
];

function NodePlatforms() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="pgvector / Pinecone / Weaviate"
        hint="The big vector-DB choices, ranked by 'do I already run Postgres?'. They all answer the same query — nearest neighbours in a 1536-dim space — but they live in very different places in your stack."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {PLATFORMS.map((p) => {
          const color = p.highlight ? VIZ.green : VIZ.violet;
          return (
            <div
              key={p.name}
              className="space-y-2 border bg-paper p-4"
              style={{
                borderColor: p.highlight ? color : 'var(--rule)',
                borderLeftWidth: 2,
                borderLeftColor: color,
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-serif text-base font-semibold">{p.name}</div>
                {p.highlight && (
                  <span
                    className="border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide"
                    style={{
                      borderColor: color,
                      color,
                      background: `${color}1F`,
                    }}
                  >
                    used here
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-0.5 text-[12px]">
                <CardRow k="Hosting" v={p.hosting} />
                <CardRow k="License" v={p.license} />
              </dl>
              <p className="pt-1 text-[13px] leading-relaxed text-foreground/80">
                {p.why}
              </p>
            </div>
          );
        })}
      </div>

      <ExplainerBlock
        title="Most teams should start with pgvector"
        body="If you already run Postgres, adding pgvector takes one CREATE EXTENSION and gets you joins, transactions, and backups for free. Move to a dedicated vector DB only when you actually hit pgvector's limits — usually somewhere north of tens of millions of vectors or sub-50ms latency budgets. Picking Pinecone on day one is almost always over-engineering."
      />
    </div>
  );
}

// ─── N34 — Indexing (ingest) ──────────────────────────────────────

type IngestResponse = {
  id: string;
  dimensions: number;
  tokens_used: number;
  provider: string;
  model: string;
};

const INGEST_PRESETS = [
  {
    id: 'rag-intro',
    text: 'Retrieval-Augmented Generation fetches relevant documents at runtime and injects them as context, so the LLM can answer questions about data it never saw during training.',
  },
  {
    id: 'pgvector-howto',
    text: 'pgvector is a Postgres extension that adds a vector data type and operators like <=> for cosine distance, letting you ORDER BY similarity directly in SQL.',
  },
  {
    id: 'cosine-distance',
    text: 'Cosine distance measures the angle between two vectors. Identical direction is 0, opposite is 2, and unrelated vectors land near 1. Smaller distance means more similar meaning.',
  },
  {
    id: 'embedding-cost',
    text: 'OpenAI text-embedding-3-small costs about $0.02 per million tokens, which makes indexing a typical knowledge base usually a few dollars even for large corpora.',
  },
];

function NodeIngest({
  docs,
  docsLoading,
  docsError,
  refreshDocs,
  deleteDoc,
}: {
  docs: Doc[];
  docsLoading: boolean;
  docsError: string | null;
  refreshDocs: () => void;
  deleteDoc: (id: string) => void;
}) {
  const [id, setId] = useState(INGEST_PRESETS[0].id);
  const [text, setText] = useState(INGEST_PRESETS[0].text);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPreset = (i: number) => {
    setId(INGEST_PRESETS[i].id);
    setText(INGEST_PRESETS[i].text);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day07/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, text }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as IngestResponse);
      await refreshDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Indexing embeddings"
        hint="Embed a document and upsert it into Postgres. The text + its 1536-float vector become one row you can query later. Re-ingest the same id and the row is replaced."
      />

      <form onSubmit={submit} className="space-y-4">
        <StaticEmbedBadge />
        <div className="flex flex-wrap gap-2">
          {INGEST_PRESETS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pickPreset(i)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              preset {i + 1}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[200px_1fr]">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              id (primary key)
            </span>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={loading}
              className="w-full border border-rule bg-paper p-2.5 font-mono text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              text
            </span>
            <textarea aria-label="Form input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              rows={4}
              className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
            />
          </div>
        </div>

        <SubmitButton
          loading={loading}
          idle="Embed + upsert →"
          busy="Storing…"
          disabled={loading || !id.trim() || !text.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div
          className="border bg-paper p-3"
          style={{ borderLeft: `2px solid ${VIZ.green}` }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.green }}
          >
            stored
          </div>
          <div className="mt-0.5 text-[13px] text-foreground/90">
            <span className="font-mono">{result.id}</span> — {result.dimensions}{' '}
            dims · {result.tokens_used} tok · {result.provider}
          </div>
        </div>
      )}

      <div className="border-t border-rule pt-6">
        <DocList
          docs={docs}
          docsLoading={docsLoading}
          docsError={docsError}
          refreshDocs={refreshDocs}
          onDelete={deleteDoc}
        />
      </div>

      <ExplainerBlock
        title="Embed once, store forever"
        body="Indexing is just a one-time embedding call plus an INSERT. Once the row exists, every future query against this document costs nothing — you only pay tokens to embed the query, not the corpus. Re-embed and overwrite only when the source text changes or you switch embedding models."
      />
    </div>
  );
}

// ─── N35 — Similarity search ──────────────────────────────────────

type SearchHit = { id: string; text: string; score: number };
type SearchResponse = {
  query: string;
  results: SearchHit[];
  tokens_used: number;
  provider: string;
  model: string;
};

const SEARCH_PRESETS = [
  'How do I keep an LLM grounded in my own data?',
  'How much does it cost to embed a million tokens?',
  'How does Postgres do similarity search?',
];

function NodeSearch({ docCount }: { docCount: number }) {
  const [query, setQuery] = useState(SEARCH_PRESETS[0]);
  const [topK, setTopK] = useState(5);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day07/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: topK }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as SearchResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Similarity search"
        hint="Embed the query, ask Postgres for the nearest rows by cosine distance, return them in order. This is the entire retrieval half of RAG — Day 8 just adds an LLM on top."
      />

      <form onSubmit={submit} className="space-y-4">
        <StaticEmbedBadge />
        <div className="flex flex-wrap gap-2">
          {SEARCH_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuery(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              query {i + 1}
            </button>
          ))}
        </div>
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Query
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="w-full border border-rule bg-paper p-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              top_k
            </span>
            <span className="font-mono text-[11px] text-foreground/80">
              {topK}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={Math.max(10, Math.min(20, Math.max(docCount, 1)))}
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value, 10))}
            disabled={loading}
            className="w-full"
          />
        </div>
        <SubmitButton
          loading={loading}
          idle="Search the DB →"
          busy="Querying…"
          disabled={loading || !query.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {docCount === 0 && !error && (
        <p className="border border-rule border-dashed bg-paper/40 p-3 text-[13px] text-muted">
          The documents table is empty — go to N34 Indexing first.
        </p>
      )}

      {result && result.results.length === 0 && (
        <p className="border border-rule border-dashed bg-paper/40 p-3 text-[13px] text-muted">
          No matching rows. Try ingesting documents on closer topics in N34.
        </p>
      )}

      {result && result.results.length > 0 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            pgvector cosine-distance results
          </div>
          <ol className="space-y-2">
            {result.results.map((r, i) => {
              const isTop = i === 0;
              const color = isTop ? VIZ.green : VIZ.blue;
              return (
                <li
                  key={r.id}
                  className="space-y-1.5 border bg-paper p-3"
                  style={{
                    borderColor: color,
                    borderLeftWidth: 2,
                    borderLeftColor: color,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="shrink-0 font-mono text-[11px] uppercase tracking-wide"
                      style={{ color }}
                    >
                      {r.id}
                    </span>
                    <span
                      className="shrink-0 font-mono text-[11px]"
                      style={{ color }}
                    >
                      {(r.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[13px] text-foreground/90">{r.text}</p>
                  <ScoreBar pct={r.score * 100} color={color} />
                </li>
              );
            })}
          </ol>
          <Footer>
            {result.provider} · {result.model} · {result.tokens_used} tok ·{' '}
            {result.results.length} rows
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="ORDER BY embedding <=> query::vector LIMIT k"
        body="That single SQL fragment is the whole thing. pgvector adds the <=> operator (cosine distance), and Postgres just sorts the table by that distance and returns the top-k rows. Add an IVFFlat or HNSW index and the same query stays fast at millions of rows. This is the engine that Day 8 RAG wraps an LLM around."
      />
    </div>
  );
}
