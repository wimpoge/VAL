'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ModelSwitcher from '../components/ModelSwitcher';
import { Markdown } from '../components/Markdown';
import { useNodeProgress } from '../components/useNodeProgress';
import DayPager from '../components/DayPager';

const NODES = [
  { id: 'N36', label: 'What is RAG', title: 'What is RAG?' },
  { id: 'N37', label: 'vs Fine-tune', title: 'RAG vs fine-tuning' },
  { id: 'N38', label: 'Implementing', title: 'Implementing RAG' },
  { id: 'N39', label: 'Retrieval', title: 'Retrieval process' },
  { id: 'N40', label: 'Generation', title: 'Generation step' },
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

type SourceItem = { source: string; chunks: number; last_index: number };

export default function Day08Page() {
  const [activeId, setActiveId] = useState('N36');
  const progress = useNodeProgress(8);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  const [sources, setSources] = useState<SourceItem[]>([]);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [sourcesLoading, setSourcesLoading] = useState(true);

  const refreshSources = useCallback(async () => {
    setSourcesError(null);
    try {
      const r = await fetch(`${API}/day08/sources`);
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      const json = (await r.json()) as {
        sources: SourceItem[];
        count: number;
      };
      setSources(json.sources);
    } catch (e) {
      setSourcesError(e instanceof Error ? e.message : String(e));
    } finally {
      setSourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API}/day08/sources`);
        if (cancelled) return;
        if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
        const json = (await r.json()) as {
          sources: SourceItem[];
          count: number;
        };
        if (!cancelled) setSources(json.sources);
      } catch (e) {
        if (!cancelled) {
          setSourcesError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setSourcesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const deleteSource = useCallback(
    async (source: string) => {
      try {
        const r = await fetch(
          `${API}/day08/sources/${encodeURIComponent(source)}`,
          { method: 'DELETE' },
        );
        if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
        await refreshSources();
      } catch (e) {
        setSourcesError(e instanceof Error ? e.message : String(e));
      }
    },
    [refreshSources],
  );

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 08 · RAG
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
          The model gets <span className="text-accent">your documents</span>.
        </h1>
        <p className="text-sm text-muted">
          Upload text, retrieve the relevant chunks, ground the answer in
          them. Each tab is N36–N40.
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

      <div className={activeId === 'N36' ? undefined : 'hidden'}>
        <NodeWhatIs
          sources={sources}
          sourcesLoading={sourcesLoading}
          sourcesError={sourcesError}
          refreshSources={refreshSources}
        />
      </div>
      <div className={activeId === 'N37' ? undefined : 'hidden'}>
        <NodeVsFineTune sourceCount={sources.length} />
      </div>
      <div className={activeId === 'N38' ? undefined : 'hidden'}>
        <NodeImplementing
          sources={sources}
          sourcesLoading={sourcesLoading}
          sourcesError={sourcesError}
          refreshSources={refreshSources}
          deleteSource={deleteSource}
        />
      </div>
      <div className={activeId === 'N39' ? undefined : 'hidden'}>
        <NodeRetrieval sourceCount={sources.length} />
      </div>
      <div className={activeId === 'N40' ? undefined : 'hidden'}>
        <NodeGeneration sourceCount={sources.length} />
      </div>
      <DayPager day={8} />
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

function ProviderRow({
  provider,
  onChange,
  disabled,
}: {
  provider: string;
  onChange: (p: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-rule pb-3">
      <span className="font-mono text-xs uppercase tracking-wide text-muted">
        Generation provider
      </span>
      <ModelSwitcher
        selected={provider}
        onChange={onChange}
        disabled={disabled}
      />
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

function SourceList({
  sources,
  sourcesLoading,
  sourcesError,
  refreshSources,
  onDelete,
}: {
  sources: SourceItem[];
  sourcesLoading: boolean;
  sourcesError: string | null;
  refreshSources: () => void;
  onDelete?: (source: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Indexed sources — {sourcesLoading ? '…' : `${sources.length}`}
        </div>
        <button
          type="button"
          onClick={refreshSources}
          className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground"
        >
          refresh
        </button>
      </div>
      {sourcesError && <ErrorBox message={sourcesError} />}
      {!sourcesError && sources.length === 0 && !sourcesLoading && (
        <p className="border border-rule border-dashed bg-paper/40 p-3 text-[13px] text-muted">
          Nothing indexed yet. Go to N38 Implementing to upload some text.
        </p>
      )}
      {sources.length > 0 && (
        <ul className="space-y-1.5">
          {sources.map((s) => (
            <li
              key={s.source}
              className="flex items-center gap-2 border border-rule bg-paper p-2.5"
            >
              <span
                className="shrink-0 font-mono text-[11px] uppercase tracking-wide"
                style={{ color: VIZ.violet }}
              >
                {s.source}
              </span>
              <span className="flex-1 text-[12px] text-muted">
                {s.chunks} chunks
              </span>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(s.source)}
                  className="shrink-0 font-mono text-[11px] text-muted transition hover:text-accent"
                  aria-label={`delete ${s.source}`}
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

type Chunk = {
  id: number;
  source: string;
  chunk_index: number;
  text: string;
  score: number;
};

function ChunkList({ chunks }: { chunks: Chunk[] }) {
  return (
    <ol className="space-y-2">
      {chunks.map((c, i) => {
        const color = i === 0 ? VIZ.green : VIZ.blue;
        return (
          <li
            key={c.id}
            className="space-y-1.5 border bg-paper p-3"
            style={{
              borderColor: color,
              borderLeftWidth: 2,
              borderLeftColor: color,
            }}
          >
            <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em]">
              <span style={{ color }}>
                {c.source} · #{c.chunk_index}
              </span>
              <span style={{ color }}>{(c.score * 100).toFixed(1)}%</span>
            </div>
            <p className="text-[13px] leading-relaxed text-foreground/85">
              {c.text}
            </p>
            <ScoreBar pct={c.score * 100} color={color} />
          </li>
        );
      })}
    </ol>
  );
}

// ─── N36 — What is RAG? ───────────────────────────────────────────

const RAG_STEPS: { label: string; sub: string; color: string }[] = [
  { label: '1 · Index', sub: 'chunk + embed your docs once into pgvector', color: VIZ.green },
  { label: '2 · Embed query', sub: 'turn the user question into a vector', color: VIZ.blue },
  { label: '3 · Retrieve', sub: 'top-k chunks by cosine distance', color: VIZ.violet },
  { label: '4 · Augment', sub: 'paste the chunks into the system prompt', color: VIZ.amber },
  { label: '5 · Generate', sub: 'LLM answers from that context only', color: VIZ.coral },
];

function NodeWhatIs({
  sources,
  sourcesLoading,
  sourcesError,
  refreshSources,
}: {
  sources: SourceItem[];
  sourcesLoading: boolean;
  sourcesError: string | null;
  refreshSources: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="What is RAG?"
        hint="Retrieval-Augmented Generation. The LLM never reads your documents during training — instead, every query fetches the relevant chunks at runtime and pastes them into the prompt before the model answers."
      />

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          The five-step pipeline
        </div>
        <ol className="grid grid-cols-1 gap-2 md:grid-cols-5">
          {RAG_STEPS.map((s) => (
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
              <p className="text-[12px] leading-snug text-foreground/80">
                {s.sub}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-rule pt-6">
        <SourceList
          sources={sources}
          sourcesLoading={sourcesLoading}
          sourcesError={sourcesError}
          refreshSources={refreshSources}
        />
      </div>

      <ExplainerBlock
        title="The cheap fix for stale or private knowledge"
        body="A pre-trained LLM has frozen knowledge ending at its training cutoff and knows nothing about your private documents. RAG sidesteps both problems without retraining: it asks an embedding model to find the most relevant chunks of your data for the user's question, then hands those chunks to the LLM as context. The model still answers in its own voice — but now it's answering about your stuff."
      />
    </div>
  );
}

// ─── N37 — RAG vs fine-tuning ─────────────────────────────────────

type CompareResponse = {
  question: string;
  plain: {
    answer: string;
    prompt_tokens: number;
    completion_tokens: number;
    latency_ms: number;
  };
  rag: {
    answer: string;
    prompt_tokens: number;
    completion_tokens: number;
    latency_ms: number;
    sources: Chunk[];
  };
  embed_tokens: number;
  gen_provider: string;
  gen_model: string;
};

const COMPARE_PRESETS = [
  'What does this app say about how RAG works?',
  'Which chunk size does the indexing pipeline use?',
  'What does Postgres do with the <=> operator?',
];

const APPROACH_CARDS: {
  name: string;
  color: string;
  rows: { k: string; v: string }[];
  body: string;
}[] = [
  {
    name: 'RAG',
    color: VIZ.green,
    rows: [
      { k: 'Where', v: 'in the prompt at runtime' },
      { k: 'Update', v: 're-embed only the changed docs' },
      { k: 'Cost', v: 'embedding tokens + a slightly longer prompt' },
      { k: 'Time', v: 'minutes to set up' },
      { k: 'Privacy', v: 'documents stay in your DB' },
    ],
    body: 'Best when the knowledge changes often, must be private, or only matters to a subset of users. The cheap, fast default for "make the model know my stuff".',
  },
  {
    name: 'Fine-tuning',
    color: VIZ.amber,
    rows: [
      { k: 'Where', v: 'in the model weights' },
      { k: 'Update', v: 'retrain on the new dataset' },
      { k: 'Cost', v: 'training $$ + ongoing per-token inference' },
      { k: 'Time', v: 'hours to days per iteration' },
      { k: 'Privacy', v: 'data baked into a model artifact' },
    ],
    body: 'Best when you want a permanent behavior change (style, format, domain-specific reasoning) on data that is stable and you control. Overkill for most "answer about my docs" use cases.',
  },
];

function NodeVsFineTune({ sourceCount }: { sourceCount: number }) {
  const [question, setQuestion] = useState(COMPARE_PRESETS[0]);
  const [provider, setProvider] = useState('openai');
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day08/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, provider }),
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
    <div className="space-y-6">
      <SectionHeader
        title="RAG vs fine-tuning"
        hint="Two ways to give a model knowledge it doesn't have. RAG injects context at runtime; fine-tuning bakes it into the weights. Below: an interactive side-by-side of the same question with and without the retrieved context."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {APPROACH_CARDS.map((card) => (
          <div
            key={card.name}
            className="space-y-2 border bg-paper p-4"
            style={{
              borderColor: card.color,
              borderLeftWidth: 2,
              borderLeftColor: card.color,
            }}
          >
            <div
              className="font-mono text-[11px] uppercase tracking-[0.18em]"
              style={{ color: card.color }}
            >
              {card.name}
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-0.5 text-[12px] sm:grid-cols-2">
              {card.rows.map((row) => (
                <div key={row.k} className="flex gap-2">
                  <dt className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted">
                    {row.k}
                  </dt>
                  <dd className="text-foreground/85">{row.v}</dd>
                </div>
              ))}
            </dl>
            <p className="pt-1 text-[13px] leading-relaxed text-foreground/80">
              {card.body}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4 border-t border-rule pt-6">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          {COMPARE_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuestion(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              question {i + 1}
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
          idle="Ask with vs without RAG →"
          busy="Comparing…"
          disabled={loading || !question.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}
      {sourceCount === 0 && !error && (
        <p className="border border-rule border-dashed bg-paper/40 p-3 text-[13px] text-muted">
          Heads up — no documents indexed yet. The RAG side will just say
          &quot;I don&apos;t have that in the provided documents.&quot; Visit
          N38 first.
        </p>
      )}

      {(result || loading) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ApproachColumn
            label="Plain LLM — no retrieval"
            color={VIZ.amber}
            loading={loading}
            answer={result?.plain.answer ?? null}
            footerNote={
              result
                ? `${result.plain.prompt_tokens}+${result.plain.completion_tokens} tok · ${result.plain.latency_ms}ms`
                : ''
            }
          />
          <ApproachColumn
            label="RAG — with retrieved context"
            color={VIZ.green}
            loading={loading}
            answer={result?.rag.answer ?? null}
            footerNote={
              result
                ? `${result.rag.prompt_tokens}+${result.rag.completion_tokens} tok · ${result.rag.latency_ms}ms · ${result.rag.sources.length} chunks`
                : ''
            }
            sources={result?.rag.sources}
          />
        </div>
      )}

      {result && (
        <Footer>
          {result.gen_provider} · {result.gen_model} · embed{' '}
          {result.embed_tokens} tok
        </Footer>
      )}

      <ExplainerBlock
        title="When to reach for which"
        body="If the answer 'lives' in documents you can list — wikis, contracts, product manuals, last week's tickets — start with RAG. It is cheap, debuggable, and immediately updatable. Reach for fine-tuning only when you need a permanent style shift, a domain-specific tone, or behavior that prompts can't reliably elicit — and even then, RAG often sits on top of the fine-tuned model."
      />
    </div>
  );
}

function ApproachColumn({
  label,
  color,
  loading,
  answer,
  footerNote,
  sources,
}: {
  label: string;
  color: string;
  loading: boolean;
  answer: string | null;
  footerNote: string;
  sources?: Chunk[];
}) {
  const [showSources, setShowSources] = useState(false);
  return (
    <div
      className="space-y-2 border border-rule bg-paper p-3"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {label}
      </div>
      {loading && answer === null ? (
        <div className="font-mono text-xs uppercase tracking-wide text-muted">
          asking…
        </div>
      ) : answer !== null ? (
        <>
          <div className="text-[13px] leading-relaxed text-foreground/90">
            <Markdown text={answer} />
          </div>
          {sources && sources.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowSources((v) => !v)}
                className="font-mono text-[11px] uppercase tracking-wide text-muted transition hover:text-foreground"
              >
                {showSources
                  ? `▾ hide ${sources.length} sources`
                  : `▸ show ${sources.length} sources`}
              </button>
              {showSources && <ChunkList chunks={sources} />}
            </div>
          )}
          <Footer>{footerNote}</Footer>
        </>
      ) : null}
    </div>
  );
}

// ─── N38 — Implementing RAG (upload + chunking) ───────────────────

type UploadResponse = {
  source: string;
  chunks_stored: number;
  tokens_used: number;
  chunk_size: number;
  chunk_overlap: number;
  embed_provider: string;
  embed_model: string;
  preview: string[];
};

const PASTE_PRESETS = [
  {
    source: 'rag-notes.txt',
    text:
      "Retrieval-Augmented Generation grounds an LLM in your private data without retraining. " +
      "The pipeline has five steps: chunk the documents, embed each chunk into a 1536-dim vector, " +
      "store rows in a vector database, embed the user's question at query time, and ask " +
      "Postgres for the nearest chunks by cosine distance.\n\n" +
      "This app chunks text into 500-character pieces with a 50-character overlap so context " +
      "around a chunk boundary is not lost. The pgvector operator <=> returns cosine distance " +
      "directly, so ORDER BY embedding <=> query_vec LIMIT k gives you the top-k results in one " +
      "SQL query. Day 7 built the same retrieval primitive; Day 8 wraps it with an LLM.",
  },
  {
    source: 'pizza-recipe.txt',
    text:
      "Margherita pizza dough is flour, water, salt, and a tiny amount of yeast, kneaded and " +
      "rested for at least 24 hours in the fridge. The slow cold ferment develops flavor and " +
      "gluten without bulk yeast. Stretch the dough by hand — never roll — to keep the air " +
      "pockets in the crust.\n\n" +
      "Top sparingly: crushed San Marzano tomatoes, torn fresh mozzarella di bufala, a few " +
      "basil leaves, a drizzle of olive oil. Bake on a preheated stone or steel at the highest " +
      "temperature your oven can manage. Two minutes at 280°C is better than ten at 180°C.",
  },
];

function NodeImplementing({
  sources,
  sourcesLoading,
  sourcesError,
  refreshSources,
  deleteSource,
}: {
  sources: SourceItem[];
  sourcesLoading: boolean;
  sourcesError: string | null;
  refreshSources: () => void;
  deleteSource: (source: string) => void;
}) {
  const [mode, setMode] = useState<'paste' | 'file'>('paste');
  const [source, setSource] = useState(PASTE_PRESETS[0].source);
  const [text, setText] = useState(PASTE_PRESETS[0].text);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPreset = (i: number) => {
    setSource(PASTE_PRESETS[i].source);
    setText(PASTE_PRESETS[i].text);
  };

  const submitPaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day08/upload-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, text }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as UploadResponse);
      await refreshSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const submitFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch(`${API}/day08/upload`, {
        method: 'POST',
        body: form,
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as UploadResponse);
      await refreshSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Implementing RAG"
        hint="Indexing is one-time: chunk the source into overlapping 500-character pieces, embed each chunk in batch, and insert into pgvector. Use the paste tab to type text inline, or upload a .txt file."
      />

      <div className="flex flex-wrap gap-2">
        {(['paste', 'file'] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setResult(null);
                setError(null);
              }}
              className="border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition"
              style={{
                borderColor: active ? VIZ.violet : 'var(--rule)',
                color: active ? VIZ.violet : undefined,
                background: active ? `${VIZ.violet}14` : undefined,
              }}
            >
              {m === 'paste' ? 'paste text' : 'upload .txt'}
            </button>
          );
        })}
      </div>

      {mode === 'paste' ? (
        <form onSubmit={submitPaste} className="space-y-4">
          <StaticEmbedBadge />
          <div className="flex flex-wrap gap-2">
            {PASTE_PRESETS.map((_, i) => (
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
                source (filename)
              </span>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
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
                rows={6}
                className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
              />
            </div>
          </div>
          <SubmitButton
            loading={loading}
            idle="Chunk + embed + insert →"
            busy="Indexing…"
            disabled={loading || !source.trim() || !text.trim()}
          />
        </form>
      ) : (
        <form onSubmit={submitFile} className="space-y-4">
          <StaticEmbedBadge />
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              .txt file (max 256 KB, UTF-8)
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,text/plain"
              disabled={loading}
              className="w-full border border-rule bg-paper p-2.5 text-sm outline-none file:mr-3 file:rounded-none file:border file:border-rule file:bg-paper file:px-2 file:py-1 file:font-mono file:text-[11px] file:uppercase file:text-foreground/70"
            />
          </div>
          <SubmitButton
            loading={loading}
            idle="Upload + chunk + embed →"
            busy="Indexing…"
            disabled={loading}
          />
        </form>
      )}

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3">
          <div
            className="border bg-paper p-3"
            style={{ borderLeft: `2px solid ${VIZ.green}` }}
          >
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: VIZ.green }}
            >
              indexed
            </div>
            <div className="mt-0.5 text-[13px] text-foreground/90">
              <span className="font-mono">{result.source}</span> —{' '}
              {result.chunks_stored} chunks · {result.chunk_size}-char ·{' '}
              {result.chunk_overlap}-char overlap · {result.tokens_used} tok
            </div>
          </div>
          {result.preview.length > 0 && (
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                first {result.preview.length} chunks
              </div>
              <ul className="space-y-1.5">
                {result.preview.map((p, i) => (
                  <li
                    key={i}
                    className="border border-rule bg-paper p-2.5 text-[12px] leading-relaxed text-foreground/85"
                  >
                    <span
                      className="mr-2 font-mono text-[10px] uppercase tracking-wide"
                      style={{ color: VIZ.blue }}
                    >
                      #{i}
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-rule pt-6">
        <SourceList
          sources={sources}
          sourcesLoading={sourcesLoading}
          sourcesError={sourcesError}
          refreshSources={refreshSources}
          onDelete={deleteSource}
        />
      </div>

      <ExplainerBlock
        title="Why chunks, not whole documents"
        body="Embedding a whole 50-page PDF into one vector wastes everything an embedding is good at — the meaning of the back is averaged with the meaning of the front. Splitting into ~500-character chunks gives the retriever fine-grained pieces to match against the query. The 50-character overlap means a relevant sentence near a chunk boundary still shows up in two chunks, so retrieval doesn't miss it."
      />
    </div>
  );
}

// ─── N39 — Retrieval process (no LLM) ─────────────────────────────

type RetrieveResponse = {
  question: string;
  results: Chunk[];
  embed_tokens: number;
  embed_provider: string;
  embed_model: string;
};

const RETRIEVE_PRESETS = [
  'How does this app chunk text?',
  'What is the pgvector cosine operator?',
  'How do I bake pizza properly?',
];

function NodeRetrieval({ sourceCount }: { sourceCount: number }) {
  const [question, setQuestion] = useState(RETRIEVE_PRESETS[0]);
  const [topK, setTopK] = useState(5);
  const [result, setResult] = useState<RetrieveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day08/retrieve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, top_k: topK }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as RetrieveResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Retrieval process"
        hint="Just the retrieval half — embed the question, pull the top-k chunks, no LLM call. This is exactly what gets handed to the generator in the next tab."
      />

      <form onSubmit={submit} className="space-y-4">
        <StaticEmbedBadge />
        <div className="flex flex-wrap gap-2">
          {RETRIEVE_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuestion(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              question {i + 1}
            </button>
          ))}
        </div>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          className="w-full border border-rule bg-paper p-2.5 text-sm outline-none focus:border-accent"
        />
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
            max={10}
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value, 10))}
            disabled={loading}
            className="w-full"
          />
        </div>
        <SubmitButton
          loading={loading}
          idle="Retrieve only →"
          busy="Searching chunks…"
          disabled={loading || !question.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {sourceCount === 0 && !error && (
        <p className="border border-rule border-dashed bg-paper/40 p-3 text-[13px] text-muted">
          Nothing to retrieve — go to N38 and index something first.
        </p>
      )}

      {result && result.results.length === 0 && (
        <p className="border border-rule border-dashed bg-paper/40 p-3 text-[13px] text-muted">
          No chunks matched. Add more source text or try a different
          question.
        </p>
      )}

      {result && result.results.length > 0 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            top-{result.results.length} chunks by cosine similarity
          </div>
          <ChunkList chunks={result.results} />
          <Footer>
            embed only · {result.embed_provider} · {result.embed_model} ·{' '}
            {result.embed_tokens} tok · no LLM call
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="Retrieval has no model opinion"
        body="This step never invokes an LLM. It runs one cheap embedding call (a few hundred tokens on text-embedding-3-small) plus one pgvector SQL query, and returns whatever chunks are mathematically closest. Treat retrieval quality and generation quality as separate problems — bad answers usually mean bad retrieval, not a dumb model."
      />
    </div>
  );
}

// ─── N40 — Generation step (full /ask) ────────────────────────────

type AskResponse = {
  question: string;
  answer: string;
  sources: Chunk[];
  embed_tokens: number;
  gen_tokens: number;
  gen_prompt_tokens: number;
  gen_completion_tokens: number;
  gen_provider: string;
  gen_model: string;
  latency_ms: number;
};

const ASK_PRESETS = [
  'How does this app implement RAG?',
  'What chunk size and overlap does the indexer use?',
  'Why is pgvector good enough for this project?',
];

function NodeGeneration({ sourceCount }: { sourceCount: number }) {
  const [question, setQuestion] = useState(ASK_PRESETS[0]);
  const [topK, setTopK] = useState(5);
  const [provider, setProvider] = useState('openai');
  const [result, setResult] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowSources(false);
    try {
      const r = await fetch(`${API}/day08/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, provider, top_k: topK }),
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
    <div className="space-y-6">
      <SectionHeader
        title="Generation step"
        hint="The full pipeline: retrieve the top-k chunks, paste them into a strict system prompt (answer only from context), let the LLM finish. Embedding is always OpenAI; the generator is your pick."
      />

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <StaticEmbedBadge />
          <ProviderRow
            provider={provider}
            onChange={setProvider}
            disabled={loading}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ASK_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuestion(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              question {i + 1}
            </button>
          ))}
        </div>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          className="w-full border border-rule bg-paper p-2.5 text-sm outline-none focus:border-accent"
        />
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              top_k chunks
            </span>
            <span className="font-mono text-[11px] text-foreground/80">
              {topK}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value, 10))}
            disabled={loading}
            className="w-full"
          />
        </div>
        <SubmitButton
          loading={loading}
          idle="Retrieve + generate →"
          busy="Answering…"
          disabled={loading || !question.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {sourceCount === 0 && !error && (
        <p className="border border-rule border-dashed bg-paper/40 p-3 text-[13px] text-muted">
          No documents indexed. The model will refuse with &quot;I don&apos;t
          have that in the provided documents.&quot; Visit N38 first.
        </p>
      )}

      {result && (
        <div className="space-y-3">
          <div className="border border-rule border-l-2 border-l-accent bg-paper p-4 text-[14px] leading-relaxed text-foreground/90">
            <Markdown text={result.answer} />
          </div>
          {result.sources.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowSources((v) => !v)}
                className="font-mono text-xs uppercase tracking-wide text-muted transition hover:text-foreground"
              >
                {showSources
                  ? `▾ hide ${result.sources.length} sources`
                  : `▸ show ${result.sources.length} sources`}
              </button>
              {showSources && <ChunkList chunks={result.sources} />}
            </div>
          )}
          <Footer>
            embed: openai · gen: {result.gen_provider}/{result.gen_model} ·{' '}
            {result.embed_tokens}+{result.gen_tokens} tok ·{' '}
            {result.latency_ms}ms
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="The system prompt is the whole trick"
        body="Behind the scenes, the chunks get pasted into a system prompt that says 'use ONLY this context, and if it isn't there, say so'. That single instruction is the difference between a chatbot that hallucinates and a RAG app that cites your documents. Swap the generator provider above — the answer changes voice, but the grounding stays the same."
      />
    </div>
  );
}
