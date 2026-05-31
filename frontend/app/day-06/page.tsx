'use client';

import { useState } from 'react';
import { useNodeProgress } from '../components/useNodeProgress';
import DayPager from '../components/DayPager';

const NODES = [
  { id: 'N26', label: 'Inspector', title: 'What are embeddings?' },
  { id: 'N27', label: 'Search', title: 'Semantic search' },
  { id: 'N28', label: 'Classify', title: 'Data classification' },
  { id: 'N29', label: 'Recommend', title: 'Recommendation systems' },
  { id: 'N30', label: 'Anomaly', title: 'Anomaly detection' },
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

export default function Day06Page() {
  const [activeId, setActiveId] = useState('N26');
  const progress = useNodeProgress(6);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 06 · Embeddings
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
          Meaning becomes <span className="text-accent">geometry</span>.
        </h1>
        <p className="text-sm text-muted">
          Inspect a vector, search by meaning, classify without a model,
          recommend by proximity, and surface outliers. Each tab is N26–N30.
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

      <div className={activeId === 'N26' ? undefined : 'hidden'}>
        <NodeInspector />
      </div>
      <div className={activeId === 'N27' ? undefined : 'hidden'}>
        <NodeSearch />
      </div>
      <div className={activeId === 'N28' ? undefined : 'hidden'}>
        <NodeClassify />
      </div>
      <div className={activeId === 'N29' ? undefined : 'hidden'}>
        <NodeRecommend />
      </div>
      <div className={activeId === 'N30' ? undefined : 'hidden'}>
        <NodeAnomaly />
      </div>
      <DayPager day={6} />
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

function PresetRow({
  presets,
  onPick,
  disabled,
  labelPrefix,
}: {
  presets: string[];
  onPick: (p: string) => void;
  disabled: boolean;
  labelPrefix: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(p)}
          disabled={disabled}
          className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
        >
          {labelPrefix} {i + 1}
        </button>
      ))}
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

function ScoreBar({
  pct,
  color,
}: {
  pct: number;
  color: string;
}) {
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

// ─── N26 — What are embeddings? (inspector) ───────────────────────

type EmbedResponse = {
  embedding: number[];
  dimensions: number;
  tokens_used: number;
  provider: string;
  model: string;
};

const EMBED_PRESETS = [
  'A black cat curled up on a sunny windowsill.',
  'Retrieval-Augmented Generation grounds the model in your documents.',
  'Sunday brunch with pancakes and strong coffee.',
];

function NodeInspector() {
  const [text, setText] = useState(EMBED_PRESETS[0]);
  const [result, setResult] = useState<EmbedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day06/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as EmbedResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="What are embeddings?"
        hint="An embedding is a list of numbers that captures the meaning of a piece of text. Similar meanings end up close together in this number space — that's the trick the rest of the day builds on."
      />
      <form onSubmit={submit} className="space-y-4">
        <StaticEmbedBadge />
        <PresetRow
          presets={EMBED_PRESETS}
          onPick={setText}
          disabled={loading}
          labelPrefix="text"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          className="w-full border border-rule bg-paper p-3 text-sm outline-none focus:border-accent"
          placeholder="Type a sentence to embed…"
        />
        <SubmitButton
          loading={loading}
          idle="Embed →"
          busy="Embedding…"
          disabled={loading || !text.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && <VectorPreview vector={result.embedding} />}

      {result && (
        <Footer>
          {result.provider} · {result.model} · {result.dimensions} dims ·{' '}
          {result.tokens_used} tok
        </Footer>
      )}

      <ExplainerBlock
        title="Meaning becomes coordinates"
        body="The model squeezes the whole sentence into a fixed-length list of numbers (1536 of them with this OpenAI model). You'll never read it directly — but two sentences with similar meaning produce vectors that point in almost the same direction. Every Day 6 demo is the same one trick used four different ways."
      />
    </div>
  );
}

function VectorPreview({ vector }: { vector: number[] }) {
  const slice = vector.slice(0, 32);
  const maxAbs = Math.max(0.0001, ...slice.map((v) => Math.abs(v)));
  return (
    <div className="space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        First 32 dimensions
      </div>
      <div className="flex h-16 items-end gap-[2px] border border-rule bg-paper p-2">
        {slice.map((v, i) => {
          const pct = Math.abs(v) / maxAbs;
          const positive = v >= 0;
          return (
            <div
              key={i}
              className="relative flex-1"
              style={{ height: '100%' }}
              title={`d${i}: ${v.toFixed(4)}`}
            >
              <div
                className="absolute left-0 right-0"
                style={{
                  bottom: positive ? '50%' : undefined,
                  top: positive ? undefined : '50%',
                  height: `${pct * 50}%`,
                  background: positive ? VIZ.green : VIZ.coral,
                }}
              />
              <div
                className="absolute left-0 right-0"
                style={{ top: '50%', height: 1, background: 'var(--rule)' }}
              />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-muted sm:grid-cols-4">
        {vector.slice(0, 8).map((v, i) => (
          <div key={i}>
            <span className="text-foreground/60">d{i}</span> {v.toFixed(4)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── N27 — Semantic search ────────────────────────────────────────

type SearchResult = { document: string; score: number };
type SearchResponse = {
  query: string;
  results: SearchResult[];
  all_results: SearchResult[];
  tokens_used: number;
  provider: string;
  model: string;
};

const SEARCH_QUERY_PRESETS = [
  'How do I keep an LLM grounded in my own data?',
  'Recipes with chicken and rice',
  'How to set up Postgres in Docker',
];

const SEARCH_DOC_PRESETS = [
  [
    'Retrieval-Augmented Generation fetches your documents at runtime and feeds them in as context.',
    'Fine-tuning updates the weights so the model behaves a certain way on every future call.',
    'A vector database stores embeddings and answers nearest-neighbour queries quickly.',
    'Prompt caching reuses a shared prefix across requests to save input tokens.',
    'The chocolate cake recipe needs flour, cocoa, eggs, butter, and sugar.',
  ].join('\n'),
  [
    'Hainanese chicken rice is poached chicken served with fragrant rice and chili sauce.',
    'Risotto Milanese uses arborio rice, saffron, and a touch of Parmesan.',
    'Spaghetti carbonara is pasta with eggs, pecorino, guanciale, and black pepper.',
    'A grilled cheese sandwich needs sourdough, sharp cheddar, and good butter.',
  ].join('\n'),
  [
    'pgvector adds a vector type to Postgres so you can do similarity search in SQL.',
    'docker run -d --name pg -p 5432:5432 -e POSTGRES_PASSWORD=secret postgres:16',
    'Kubernetes is a container orchestrator with declarative manifests.',
    'You can hot-reload a Python web server with uvicorn --reload for fast iteration.',
  ].join('\n'),
];

function NodeSearch() {
  const [query, setQuery] = useState(SEARCH_QUERY_PRESETS[0]);
  const [docs, setDocs] = useState(SEARCH_DOC_PRESETS[0]);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPreset = (i: number) => {
    setQuery(SEARCH_QUERY_PRESETS[i]);
    setDocs(SEARCH_DOC_PRESETS[i]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = docs
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!query.trim() || lines.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day06/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          documents: lines,
          top_k: Math.min(3, lines.length),
        }),
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
        title="Semantic search"
        hint="Embed the query and the documents, then rank the documents by closeness to the query. No keyword overlap needed — the model can match meaning even when none of the words line up."
      />
      <form onSubmit={submit} className="space-y-4">
        <StaticEmbedBadge />
        <div className="flex flex-wrap gap-2">
          {SEARCH_QUERY_PRESETS.map((_, i) => (
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
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Documents (one per line)
          </span>
          <textarea aria-label="Form input"
            value={docs}
            onChange={(e) => setDocs(e.target.value)}
            disabled={loading}
            rows={6}
            className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
          />
        </div>
        <SubmitButton
          loading={loading}
          idle="Search →"
          busy="Searching…"
          disabled={loading || !query.trim() || !docs.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Ranked by cosine similarity to query
          </div>
          <ol className="space-y-2">
            {result.all_results.map((r, i) => {
              const inTop = i < result.results.length;
              const color = inTop ? VIZ.green : VIZ.coral;
              return (
                <li
                  key={i}
                  className="space-y-1.5 border bg-paper p-3"
                  style={{
                    borderColor: inTop ? color : 'var(--rule)',
                    borderLeftWidth: inTop ? 2 : 1,
                    borderLeftColor: color,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-foreground/90">
                      {r.document}
                    </span>
                    <span
                      className="shrink-0 font-mono text-[11px]"
                      style={{ color }}
                    >
                      {(r.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <ScoreBar pct={r.score * 100} color={color} />
                </li>
              );
            })}
          </ol>
          <Footer>
            {result.provider} · {result.model} · {result.tokens_used} tok
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="Search by meaning, not letters"
        body="Old-school search counts shared keywords; embedding search compares meaning. Ask 'How do I keep an LLM grounded in my own data?' against documents that never mention 'grounded' — the RAG entry still wins, because the vectors line up. This is the building block under chatbots, help-center search, and Day 7's vector database."
      />
    </div>
  );
}

// ─── N28 — Data classification (zero-shot via embeddings) ─────────

type ClassifyScore = { label: string; score: number };
type ClassifyResponse = {
  text: string;
  scores: ClassifyScore[];
  top_label: string;
  top_score: number;
  tokens_used: number;
  provider: string;
  model: string;
};

const CLASSIFY_TEXT_PRESETS = [
  'The shipment never arrived and customer service refuses to refund me.',
  'Quick question — how do I reset my password?',
  'Thanks team, the new dashboard saved me hours this week!',
];

const CLASSIFY_LABEL_DEFAULTS = [
  'complaint',
  'question',
  'praise',
  'spam',
];

function NodeClassify() {
  const [text, setText] = useState(CLASSIFY_TEXT_PRESETS[0]);
  const [labels, setLabels] = useState<string[]>(CLASSIFY_LABEL_DEFAULTS);
  const [newLabel, setNewLabel] = useState('');
  const [result, setResult] = useState<ClassifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLabel = () => {
    const v = newLabel.trim().toLowerCase();
    if (!v || labels.includes(v)) return;
    setLabels((cur) => [...cur, v]);
    setNewLabel('');
  };
  const delLabel = (l: string) =>
    setLabels((cur) => (cur.length > 2 ? cur.filter((x) => x !== l) : cur));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || labels.length < 2) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day06/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, labels }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as ClassifyResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Data classification"
        hint="Zero-shot classification with no training: embed the text and embed every candidate label, then assign the closest label. Useful when you have categories but no labeled training data yet."
      />
      <form onSubmit={submit} className="space-y-4">
        <StaticEmbedBadge />
        <PresetRow
          presets={CLASSIFY_TEXT_PRESETS}
          onPick={setText}
          disabled={loading}
          labelPrefix="message"
        />
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Text to classify
          </span>
          <textarea aria-label="Form input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            rows={2}
            className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
          />
        </div>
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Candidate labels ({labels.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {labels.map((l) => (
              <span
                key={l}
                className="flex items-center gap-1.5 border border-rule px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-foreground/80"
              >
                {l}
                <button
                  type="button"
                  onClick={() => delLabel(l)}
                  disabled={loading || labels.length <= 2}
                  className="text-muted transition hover:text-accent disabled:opacity-30"
                  aria-label={`remove ${l}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLabel();
                }
              }}
              disabled={loading}
              placeholder="add label…"
              className="flex-1 border border-rule bg-paper p-2 text-[13px] outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={addLabel}
              disabled={loading || !newLabel.trim()}
              className="border border-rule px-3 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              + add
            </button>
          </div>
        </div>
        <SubmitButton
          loading={loading}
          idle="Classify →"
          busy="Classifying…"
          disabled={loading || !text.trim() || labels.length < 2}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Top label
            </span>
            <span
              className="border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide"
              style={{
                borderColor: VIZ.green,
                color: VIZ.green,
                background: `${VIZ.green}1F`,
              }}
            >
              {result.top_label} · {(result.top_score * 100).toFixed(1)}%
            </span>
          </div>
          <ul className="space-y-2">
            {result.scores.map((s, i) => {
              const isTop = i === 0;
              const color = isTop ? VIZ.green : VIZ.blue;
              return (
                <li key={s.label} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3 font-mono text-[12px]">
                    <span style={{ color: isTop ? color : undefined }}>
                      {s.label}
                    </span>
                    <span style={{ color }}>
                      {(s.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <ScoreBar pct={s.score * 100} color={color} />
                </li>
              );
            })}
          </ul>
          <Footer>
            {result.provider} · {result.model} · {result.tokens_used} tok
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="Labels are just more sentences"
        body="The model has no idea you're 'classifying' anything — it just embeds every string you give it. Because 'complaint', 'question', and 'praise' all sit somewhere in the same meaning space, the closest one to the incoming message wins. Add a label, delete one, change the wording — the classifier updates instantly with no retraining."
      />
    </div>
  );
}

// ─── N29 — Recommendation system ──────────────────────────────────

type Recommendation = { index: number; item: string; score: number };
type RecommendResponse = {
  seed_index: number;
  seed_item: string;
  recommendations: Recommendation[];
  all_candidates: Recommendation[];
  tokens_used: number;
  provider: string;
  model: string;
};

const RECOMMEND_ITEMS = [
  'A noir detective novel set in 1940s Los Angeles.',
  'A cozy mystery in a small English village with a vicar and a cat.',
  'A space opera about a generation ship and a rebellious AI.',
  'A romantic comedy on a Tokyo high-speed train.',
  'A philosophical sci-fi novel about identity and memory.',
  'A hard-boiled crime thriller about a missing heiress.',
  'A travel memoir hiking the Pacific Crest Trail.',
  'A cookbook focused on weeknight pasta dishes.',
];

function NodeRecommend() {
  const [items, setItems] = useState<string[]>(RECOMMEND_ITEMS);
  const [seed, setSeed] = useState(0);
  const [newItem, setNewItem] = useState('');
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    const v = newItem.trim();
    if (!v) return;
    setItems((cur) => [...cur, v]);
    setNewItem('');
  };
  const delItem = (i: number) => {
    if (items.length <= 2) return;
    setItems((cur) => cur.filter((_, j) => j !== i));
    setSeed((s) => (s >= items.length - 1 ? Math.max(0, items.length - 2) : s));
    setResult(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length < 2) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day06/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed_index: seed,
          items,
          top_k: Math.min(3, items.length - 1),
        }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as RecommendResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Recommendation systems"
        hint="Pick a 'you liked this' seed item; the system embeds every catalog entry and surfaces the closest neighbours by meaning. This is the cold-start trick — it works on day one with zero user history."
      />
      <form onSubmit={submit} className="space-y-4">
        <StaticEmbedBadge />
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Catalog ({items.length}) — click to set as seed
          </span>
          <ul className="space-y-1.5">
            {items.map((it, i) => {
              const isSeed = i === seed;
              return (
                <li
                  key={i}
                  className="flex items-center gap-2 border bg-paper p-2 transition"
                  style={{
                    borderColor: isSeed ? VIZ.violet : 'var(--rule)',
                    background: isSeed ? `${VIZ.violet}14` : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSeed(i)}
                    disabled={loading}
                    className="font-mono text-[10px] uppercase tracking-wide"
                    style={{ color: isSeed ? VIZ.violet : undefined }}
                  >
                    {isSeed ? '★ seed' : 'set'}
                  </button>
                  <span className="flex-1 text-[13px] text-foreground/90">
                    {it}
                  </span>
                  <button
                    type="button"
                    onClick={() => delItem(i)}
                    disabled={loading || items.length <= 2}
                    aria-label="remove item"
                    className="font-mono text-[11px] text-muted transition hover:text-accent disabled:opacity-30"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
              disabled={loading}
              placeholder="add a catalog item…"
              className="flex-1 border border-rule bg-paper p-2 text-[13px] outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={addItem}
              disabled={loading || !newItem.trim()}
              className="border border-rule px-3 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              + add
            </button>
          </div>
        </div>
        <SubmitButton
          loading={loading}
          idle="Recommend →"
          busy="Embedding catalog…"
          disabled={loading || items.length < 2}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3">
          <div
            className="border bg-paper p-3"
            style={{ borderLeft: `2px solid ${VIZ.violet}` }}
          >
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: VIZ.violet }}
            >
              You liked
            </div>
            <div className="mt-0.5 text-[13px] text-foreground/90">
              {result.seed_item}
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            You might also like
          </div>
          <ol className="space-y-2">
            {result.recommendations.map((r, i) => (
              <li
                key={r.index}
                className="space-y-1.5 border bg-paper p-3"
                style={{
                  borderColor: VIZ.green,
                  borderLeftWidth: 2,
                  borderLeftColor: VIZ.green,
                }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-foreground/90">
                    {i + 1}. {r.item}
                  </span>
                  <span
                    className="shrink-0 font-mono text-[11px]"
                    style={{ color: VIZ.green }}
                  >
                    {(r.score * 100).toFixed(1)}%
                  </span>
                </div>
                <ScoreBar pct={r.score * 100} color={VIZ.green} />
              </li>
            ))}
          </ol>
          <Footer>
            {result.provider} · {result.model} · {result.tokens_used} tok
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="Nearest neighbours, no history needed"
        body="Recommend-me-something usually needs months of user clicks to find patterns. Embedding distance gives you a cold-start version for free: catalog goes in once, every new user's first 'I like this' produces a usable list. Real production systems blend this with collaborative filtering as soon as they have behavior data."
      />
    </div>
  );
}

// ─── N30 — Anomaly detection ──────────────────────────────────────

type AnomalyItem = {
  index: number;
  item: string;
  distance: number;
  is_anomaly: boolean;
};
type AnomalyResponse = {
  results: AnomalyItem[];
  centroid_dimensions: number;
  threshold: number;
  mean_distance: number;
  std_distance: number;
  tokens_used: number;
  provider: string;
  model: string;
};

const ANOMALY_PRESETS = [
  [
    'Customer left a 5-star review for the dishwasher.',
    'Customer praised the dishwasher quiet cycle.',
    'Customer loved the dishwasher energy rating.',
    'Customer recommended the dishwasher to a friend.',
    'Customer asked about Bitcoin investment strategies.',
    'Customer was happy with the dishwasher delivery.',
  ].join('\n'),
  [
    'Login from user account, IP in usual home city.',
    'Login from user account, IP in usual home city.',
    'Login from user account, IP in usual home city.',
    'Login from user account, IP in usual office.',
    'Bulk download of HR records at 3am from a foreign IP.',
    'Login from user account, IP in usual home city.',
  ].join('\n'),
];

function NodeAnomaly() {
  const [items, setItems] = useState(ANOMALY_PRESETS[0]);
  const [result, setResult] = useState<AnomalyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = items
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length < 3) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day06/anomaly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as AnomalyResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const maxDist = result
    ? Math.max(...result.results.map((r) => r.distance), 0.0001)
    : 1;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Anomaly detection"
        hint="Embed every item, average the vectors to a centroid (the 'normal' point), then flag whichever items sit far from it. No labels, no training — the outlier just stands out in vector space."
      />
      <form onSubmit={submit} className="space-y-4">
        <StaticEmbedBadge />
        <div className="flex flex-wrap gap-2">
          {ANOMALY_PRESETS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setItems(ANOMALY_PRESETS[i])}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              preset {i + 1}
            </button>
          ))}
        </div>
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Items (one per line — at least 3)
          </span>
          <textarea aria-label="Form input"
            value={items}
            onChange={(e) => setItems(e.target.value)}
            disabled={loading}
            rows={7}
            className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
          />
        </div>
        <SubmitButton
          loading={loading}
          idle="Detect anomalies →"
          busy="Scoring…"
          disabled={
            loading ||
            items.split('\n').filter((s) => s.trim()).length < 3
          }
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted">
            <span>
              centroid {result.centroid_dimensions}d · mean{' '}
              {result.mean_distance.toFixed(3)} · σ{' '}
              {result.std_distance.toFixed(3)} · threshold{' '}
              {result.threshold.toFixed(3)}
            </span>
          </div>
          <ol className="space-y-2">
            {result.results.map((r) => {
              const color = r.is_anomaly ? '#E24B4A' : VIZ.green;
              const pct = (r.distance / maxDist) * 100;
              return (
                <li
                  key={r.index}
                  className="space-y-1.5 border bg-paper p-3"
                  style={{
                    borderColor: color,
                    borderLeftWidth: 2,
                    borderLeftColor: color,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-foreground/90">
                      {r.item}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {r.is_anomaly && (
                        <span
                          className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                          style={{
                            borderColor: color,
                            color,
                            background: `${color}1F`,
                          }}
                        >
                          anomaly
                        </span>
                      )}
                      <span
                        className="font-mono text-[11px]"
                        style={{ color }}
                      >
                        {r.distance.toFixed(3)}
                      </span>
                    </span>
                  </div>
                  <ScoreBar pct={pct} color={color} />
                </li>
              );
            })}
          </ol>
          <Footer>
            {result.provider} · {result.model} · {result.tokens_used} tok
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="Outliers live far from the centroid"
        body="Compute the average of every embedding to get a single 'this is what normal looks like' point. Anything whose vector sits 1.5 standard deviations beyond that distance gets flagged. The same recipe spots off-topic reviews, suspicious login patterns, or one item that doesn't belong in a batch — no training data required."
      />
    </div>
  );
}
