'use client';

import { memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AnswerCard } from '../components/Markdown';
import ModelSwitcher from '../components/ModelSwitcher';
import { useNodeProgress } from '../components/useNodeProgress';
import DayPager from '../components/DayPager';
import { useStreamingAsk } from '../components/useStreamingAsk';

const NODES = [
  { id: 'N6', label: 'LLMs', title: 'Large language models' },
  { id: 'N7', label: 'Tokens', title: 'Tokens' },
  { id: 'N8', label: 'Embeddings', title: 'Embeddings' },
  { id: 'N9', label: 'Inference', title: 'Inference' },
  { id: 'N10', label: 'Vector DBs', title: 'Vector databases (intro)' },
];

export default function Day02Page() {
  const [activeId, setActiveId] = useState('N6');
  const progress = useNodeProgress(2);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 02 · Core LLM Concepts
          </p>
          {progress.dayProgress && (
            <span className="border border-rule bg-paper px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide">
              <span className="text-accent">{progress.dayProgress.done}</span>
              <span className="text-muted"> / {progress.dayProgress.total} nodes</span>
            </span>
          )}
        </div>
        <h1 className="text-4xl font-semibold leading-tight">
          From <span className="text-accent">tokens</span> to vectors.
        </h1>
        <p className="text-sm text-muted">
          Five hands-on demos. Each tab is N6–N10.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {NODES.map((n) => {
          const isActive = n.id === activeId;
          const done = isDone(n.id);
          return (
            <button
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={[
                'flex items-center gap-1.5 border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition',
                isActive
                  ? 'border-accent bg-accent text-background'
                  : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex h-3.5 w-3.5 items-center justify-center border text-[9px] leading-none',
                  done
                    ? isActive
                      ? 'border-white bg-white text-accent'
                      : 'border-accent bg-accent text-background'
                    : isActive
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

      {activeId === 'N6' && <NodeLLMs />}
      {activeId === 'N7' && <NodeTokens />}
      {activeId === 'N8' && <NodeEmbeddings />}
      {activeId === 'N9' && <NodeInference />}
      {activeId === 'N10' && <NodeVectorDB />}
      <DayPager day={2} />
    </article>
  );
}

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

function StreamingExplainer({
  defaultQuestion,
  hint,
  title,
}: {
  defaultQuestion: string;
  hint: string;
  title: string;
}) {
  const [provider, setProvider] = useState('openai');
  const [question, setQuestion] = useState(defaultQuestion);
  const stream = useStreamingAsk();
  const loading = stream.status === 'streaming';
  const hasResult = stream.answer.length > 0 || stream.meta !== null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    stream.start({
      url: 'http://localhost:8000/day01/ask/stream',
      body: { question, provider },
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader title={title} hint={hint} />
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">
            Provider
          </span>
          <ModelSwitcher
            selected={provider}
            onChange={setProvider}
            disabled={loading}
          />
        </div>
        <textarea aria-label="Form input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          rows={3}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="border border-foreground bg-foreground px-5 py-2 font-mono text-xs uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
        >
          {loading ? 'Asking…' : 'Ask →'}
        </button>
      </form>
      {stream.error && <ErrorBox message={stream.error} />}
      {(hasResult || loading) && (
        <div className="space-y-3">
          <AnswerCard
            text={stream.answer}
            streaming={loading}
            placeholder={loading ? 'streaming…' : ''}
            diagram={stream.diagram}
          />
          {stream.meta && (
            <Footer>
              {stream.meta.provider} · {stream.meta.model} ·{' '}
              {stream.meta.promptTokens} prompt + {stream.meta.completionTokens}{' '}
              completion
            </Footer>
          )}
        </div>
      )}
    </div>
  );
}

function NodeLLMs() {
  return (
    <StreamingExplainer
      title="Large language models"
      hint="What is an LLM, how is it trained, and why does it predict the next token?"
      defaultQuestion="Explain large language models (LLMs) for an aspiring AI engineer. Cover: what they are, how they're trained, why they predict the next token, and key limits."
    />
  );
}

function NodeVectorDB() {
  return (
    <div className="space-y-10">
      <StreamingExplainer
        title="Vector databases (intro)"
        hint="What is a vector DB, why does RAG need it, and what does pgvector / Pinecone actually store?"
        defaultQuestion="Explain vector databases at an introductory level. Cover: what they store, why nearest-neighbor search matters for RAG, and name 3 popular options (e.g. pgvector, Pinecone, Weaviate)."
      />
      <VectorSearchDemo />
    </div>
  );
}

type TokenizeResponse = {
  text: string;
  pieces: string[];
  piece_count: number;
  word_count: number;
  char_count: number;
  approx_tokens: number;
  real_tokens: number | null;
  provider: string | null;
  model: string | null;
};

function NodeTokens() {
  const [text, setText] = useState(
    'Large language models predict the next token, one piece at a time.',
  );
  const [provider, setProvider] = useState('openai');
  const [result, setResult] = useState<TokenizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch('http://localhost:8000/day02/tokenize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as TokenizeResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tokens"
        hint="Visual split is approximate (regex). The 'Real tokens' count comes from the model's own usage report."
      />
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">
            Provider (real-token count)
          </span>
          <ModelSwitcher
            selected={provider}
            onChange={setProvider}
            disabled={loading}
          />
        </div>
        <textarea aria-label="Form input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          rows={4}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="border border-foreground bg-foreground px-5 py-2 font-mono text-xs uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
        >
          {loading ? 'Counting…' : 'Tokenize →'}
        </button>
      </form>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Chars" value={result.char_count} />
            <Stat label="Words" value={result.word_count} />
            <Stat label="≈ tokens (regex)" value={result.piece_count} />
            <Stat
              label="Real tokens"
              value={result.real_tokens ?? '—'}
              highlight
            />
          </div>

          <VisualView
            label={`Chars · ${result.char_count}`}
            caption="Every character is one unit — including the spaces between words."
          >
            <p className="font-mono text-[15px] leading-[2]">
              {Array.from(result.text).map((ch, i) => (
                <span key={i} className={inlineChipClass(i)}>
                  {ch === '\n' ? '⏎\n' : ch}
                </span>
              ))}
            </p>
          </VisualView>

          <VisualView
            label={`Words · ${result.word_count}`}
            caption="Whitespace-separated groups. The gaps between colored backgrounds ARE the spaces — count them."
          >
            <p className="font-mono text-[15px] leading-[2]">
              {splitWordsWithSpaces(result.text).map((part, i, arr) =>
                part.isWord ? (
                  <span
                    key={i}
                    className={inlineChipClass(
                      arr.slice(0, i).filter((p) => p.isWord).length,
                    )}
                  >
                    {part.text}
                  </span>
                ) : (
                  <span key={i}>{part.text}</span>
                ),
              )}
            </p>
          </VisualView>

          <VisualView
            label={`Regex pieces · ${result.piece_count}`}
            caption="A naive tokenizer: words AND each punctuation mark become separate pieces. Closer to how LLMs see text — but still an approximation."
          >
            <p className="font-mono text-[15px] leading-[2]">
              {renderPiecesInline(result.text, result.pieces)}
            </p>
          </VisualView>

          {result.real_tokens != null && (
            <div className="border border-rule border-l-2 border-l-accent bg-paper p-4">
              <div className="mb-1 font-mono text-xs uppercase tracking-[0.18em] text-muted">
                Real tokens · {result.real_tokens}
              </div>
              <p className="text-sm text-foreground/80">
                This is the count the model itself reports for your input. We
                don&apos;t draw the exact boundaries because each provider uses
                a different tokenizer and they aren&apos;t exposed by the API.
                The regex view above is just a feel-for-it approximation.
              </p>
            </div>
          )}

          {result.provider && result.model && (
            <Footer>
              {result.provider} · {result.model} · real tokens from usage
              report
            </Footer>
          )}
        </div>
      )}

    </div>
  );
}

function splitWordsWithSpaces(
  text: string,
): { text: string; isWord: boolean }[] {
  return text
    .split(/(\s+)/)
    .filter((s) => s.length > 0)
    .map((s) => ({ text: s, isWord: !/^\s+$/.test(s) }));
}

function renderPiecesInline(text: string, pieces: string[]) {
  // Walk the source string and consume pieces in order so we can preserve
  // the actual whitespace between them (the regex tokenizer strips spaces).
  const out: React.ReactNode[] = [];
  let cursor = 0;
  let colorIdx = 0;
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    const found = text.indexOf(p, cursor);
    if (found === -1) {
      out.push(
        <span key={`p${i}`} className={inlineChipClass(colorIdx++)}>
          {p}
        </span>,
      );
      continue;
    }
    if (found > cursor) {
      out.push(<span key={`gap${i}`}>{text.slice(cursor, found)}</span>);
    }
    out.push(
      <span key={`p${i}`} className={inlineChipClass(colorIdx++)}>
        {p}
      </span>,
    );
    cursor = found + p.length;
  }
  if (cursor < text.length) {
    out.push(<span key="tail">{text.slice(cursor)}</span>);
  }
  return out;
}

const CHIP_PALETTE = [
  'bg-[#3a2330] text-[#f5b8b8]',
  'bg-[#3a2f1f] text-[#e6c79b]',
  'bg-[#2a3320] text-[#b9d49a]',
  'bg-[#1f3a30] text-[#9ad4b8]',
  'bg-[#1f2f44] text-[#9bbedb]',
  'bg-[#2f213a] text-[#c5a3d6]',
];

function inlineChipClass(i: number): string {
  return ['rounded px-0.5', CHIP_PALETTE[i % CHIP_PALETTE.length]].join(' ');
}

function VisualView({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-rule bg-paper p-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {label}
        </div>
      </div>
      <p className="mb-3 text-xs text-muted">{caption}</p>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        'border border-rule bg-paper p-3',
        highlight ? 'border-l-2 border-l-accent' : '',
      ].join(' ')}
    >
      <div className="font-mono text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-1 font-serif text-2xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

type RankedItem = { text: string; score: number };
type EmbedResponse = {
  dimensions: number;
  total_tokens: number;
  provider: string;
  similarity_ranking: RankedItem[];
  texts: string[];
  vectors: number[][];
};

function NodeEmbeddings() {
  const [input, setInput] = useState(
    `AI engineering is the practice of building applications with LLMs.
Machine learning engineers train models from scratch.
Frontend developers focus on user interfaces.
LLM apps use embeddings for semantic search.`,
  );
  const [result, setResult] = useState<EmbedResponse | null>(null);
  const [embedKey, setEmbedKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentences = input
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sentences.length < 2) {
      setError('Enter at least 2 sentences (first is the query).');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch('http://localhost:8000/day02/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: sentences }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      const data = (await r.json()) as EmbedResponse;
      setResult(data);
      setEmbedKey((k) => k + 1);
      try {
        window.sessionStorage.setItem(
          'day02-embed-result',
          JSON.stringify({
            texts: data.texts,
            vectors: data.vectors,
            similarity_ranking: data.similarity_ranking,
          }),
        );
      } catch {
        // sessionStorage unavailable or quota exceeded — ignore
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Embeddings"
        hint="First sentence is the query. The rest are ranked by cosine similarity."
      />
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">
          Embedding model
        </span>
        <span className="border border-rule bg-paper px-2.5 py-1 font-mono text-xs uppercase tracking-wide">
          openai · text-embedding-3-small
        </span>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <textarea aria-label="Form input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          rows={6}
          className="w-full border border-rule bg-paper p-3 font-mono text-sm leading-relaxed outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading || sentences.length < 2}
          className="border border-foreground bg-foreground px-5 py-2 font-mono text-xs uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
        >
          {loading ? 'Embedding…' : 'Embed & rank →'}
        </button>
      </form>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-5">
          <p className="text-sm">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">
              Query →{' '}
            </span>
            <span className="font-medium italic">{sentences[0]}</span>
          </p>
          <ol className="space-y-2">
            {result.similarity_ranking.map((item, i) => {
              const pct = Math.max(0, Math.min(1, item.score)) * 100;
              return (
                <li key={i} className="border border-rule bg-paper p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 font-mono text-xs text-muted">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[15px] leading-relaxed">
                        {item.text}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-foreground/70">
                      {item.score.toFixed(3)}
                    </span>
                  </div>
                  <div className="mt-3 h-[2px] w-full bg-rule">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
          <Footer>
            openai · text-embedding-3-small · {result.total_tokens} tokens ·{' '}
            {result.dimensions} dims
          </Footer>
          <VectorPreview
            texts={result.texts}
            vectors={result.vectors}
            ranking={result.similarity_ranking}
            embedKey={embedKey}
          />
        </div>
      )}
    </div>
  );
}

function VectorPreview({
  texts,
  vectors,
  ranking,
  embedKey,
}: {
  texts: string[];
  vectors: number[][];
  ranking: RankedItem[];
  embedKey: number;
}) {
  if (!vectors.length || !vectors[0]?.length) return null;

  const queryText = texts[0] ?? '';
  const best = ranking[0];
  const worst = ranking[ranking.length - 1];

  return (
    <div className="space-y-6 border-t border-rule pt-6">
      <ExplainerBlock
        title="What is a vector?"
        body={`When you type a sentence, the embedding model converts it into a list of 1,536 numbers called a vector. Each number captures a tiny aspect of the sentence's meaning. Below you can see the first 24 of those numbers visualized as colored cells — red means a positive value, blue means negative. Sentences with similar meanings will have similar color patterns.`}
      />

      <HeatmapSection texts={texts} vectors={vectors} embedKey={embedKey} />

      <ExplainerBlock
        title="Why are they close or far apart?"
        body={
          best && worst
            ? `Cosine similarity between two 1,536-dimensional vectors is just a number between -1 and 1 — easy to plot as a distance. The query sits at the center of the circle, and every other sentence is pushed outward by (1 − similarity), so closer rings = more similar. Notice how "${best.text}" lands nearest the center — it scored ${best.score.toFixed(3)} similarity. "${worst.text}" sits on the outer ring — it's the least related topic.`
            : `Cosine similarity between two 1,536-dimensional vectors is just a number between -1 and 1 — easy to plot as a distance. The query sits at the center of the circle, and every other sentence is pushed outward by (1 − similarity), so closer rings = more similar.`
        }
      />

      <SimilarityCircle sentences={texts} scores={ranking} />

      <div className="border border-rule border-l-2 border-l-accent bg-paper/60 p-4 text-sm leading-relaxed text-foreground/85">
        <span className="mr-1.5" aria-hidden>
          💡
        </span>
        <span className="font-semibold">Key insight:</span> The model has never
        seen these sentences before. It understands that{' '}
        {best ? `"${shortPhrase(best.text)}"` : 'related sentences'} and{' '}
        {queryText
          ? `"${shortPhrase(queryText)}"`
          : 'the query'}{' '}
        are related topics purely from the patterns it learned during training —
        no keyword matching involved.
      </div>
    </div>
  );
}

const HEATMAP_SLICE = 24;

const HeatmapSection = memo(function HeatmapSection({
  texts,
  vectors,
  embedKey,
}: {
  texts: string[];
  vectors: number[][];
  embedKey: number;
}) {
  const totalCells = vectors.length * HEATMAP_SLICE;
  const [revealedCount, setRevealedCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setRevealedCount(0);
    if (totalCells === 0) return;
    let i = 0;
    const tick = () => {
      i += 1;
      setRevealedCount(i);
      if (i < totalCells) {
        timerRef.current = setTimeout(tick, 18);
      } else {
        timerRef.current = null;
      }
    };
    timerRef.current = setTimeout(tick, 0);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedKey]);

  const slices = vectors.map((v) => v.slice(0, HEATMAP_SLICE));
  const absMax = Math.max(...slices.flat().map((x) => Math.abs(x)), 1e-9);

  return (
    <div className="border border-rule bg-paper p-4">
      <div className="mb-1 font-mono text-xs uppercase tracking-[0.18em] text-muted">
        Vector Preview — first {HEATMAP_SLICE} of {vectors[0].length} dimensions
      </div>
      <p className="mb-4 text-xs text-muted">
        Each cell = one dimension. Color = value (blue=negative, red=positive).
      </p>
      <div className="space-y-2">
        {slices.map((row, i) => {
          const isQuery = i === 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-3">
                <span
                  className={[
                    'inline-block w-[60px] shrink-0 border px-1.5 py-0.5 text-center font-mono text-[10px] uppercase tracking-wide',
                    isQuery
                      ? 'border-accent bg-accent text-background'
                      : 'border-rule text-muted',
                  ].join(' ')}
                >
                  {isQuery ? '★ Query' : 'Other'}
                </span>
                <span
                  className="flex-1 truncate font-mono text-[11px] text-foreground/80"
                  title={texts[i]}
                >
                  {truncate(texts[i], 60)}
                </span>
              </div>
              <div className="flex gap-[1px] pl-[72px]">
                {row.map((value, j) => {
                  const cellIdx = i * HEATMAP_SLICE + j;
                  const visible = cellIdx < revealedCount;
                  return (
                    <div
                      key={j}
                      title={`dim ${j}: ${value.toFixed(4)}`}
                      style={{
                        width: 12,
                        height: 28,
                        backgroundColor: heatmapColor(value, absMax),
                        opacity: visible ? 1 : 0,
                        transition: 'opacity 220ms ease-out',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const SIM_COLORS = {
  high: '#1D9E75',
  mid: '#888888',
  low: '#BBBBBB',
};

function colorForScore(score: number): string {
  if (score >= 0.3) return SIM_COLORS.high;
  if (score >= 0.1) return SIM_COLORS.mid;
  return SIM_COLORS.low;
}

const SimilarityCircle = memo(function SimilarityCircle({
  sentences,
  scores,
}: {
  sentences: string[];
  scores: RankedItem[];
}) {
  const W = 500;
  const H = 500;
  const CX = 250;
  const CY = 250;
  const RING_HIGH = 60;
  const RING_MID = 120;
  const RING_LOW = 180;
  const QUERY_R = 14;
  const DOT_R = 10;
  const LABEL_OFFSET = 24;
  const MAX_RADIUS = 230;

  const scoreByText = new Map(scores.map((r) => [r.text, r.score]));
  const others = sentences.slice(1);
  const otherCount = Math.max(others.length, 1);
  const step = (2 * Math.PI) / otherCount;

  type Item = {
    idx: number;
    text: string;
    score: number;
    angle: number;
    radius: number;
    cx: number;
    cy: number;
    labelX: number;
    labelY: number;
    anchor: 'start' | 'middle' | 'end';
  };

  const items: Item[] = others.map((text, i) => {
    const score = scoreByText.get(text) ?? 0;
    const radius = Math.min(MAX_RADIUS, (1 - score) * 180);
    const angle = -Math.PI / 2 + i * step;
    return {
      idx: i + 1,
      text,
      score,
      angle,
      radius,
      cx: 0,
      cy: 0,
      labelX: 0,
      labelY: 0,
      anchor: 'middle',
    };
  });

  const recompute = () => {
    for (const it of items) {
      it.cx = CX + Math.cos(it.angle) * it.radius;
      it.cy = CY + Math.sin(it.angle) * it.radius;
      const labelDist = it.radius + DOT_R + LABEL_OFFSET;
      it.labelX = CX + Math.cos(it.angle) * labelDist;
      it.labelY = CY + Math.sin(it.angle) * labelDist;
      const c = Math.cos(it.angle);
      it.anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
      if (it.labelX > W - 8) it.anchor = 'end';
      else if (it.labelX < 8) it.anchor = 'start';
    }
  };
  recompute();

  const COLLISION_MIN = 64;
  for (let pass = 0; pass < 10; pass++) {
    let collided = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const dx = items[i].labelX - items[j].labelX;
        const dy = items[i].labelY - items[j].labelY;
        if (Math.hypot(dx, dy) < COLLISION_MIN) {
          items[j].angle += (20 * Math.PI) / 180;
          collided = true;
        }
      }
    }
    if (!collided) break;
    recompute();
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = (i: number) => (e: React.MouseEvent<SVGGElement>) => {
    const container = containerRef.current;
    const tip = tooltipRef.current;
    if (!container || !tip) return;
    const containerRect = container.getBoundingClientRect();
    const dotRect = e.currentTarget.getBoundingClientRect();
    const x = dotRect.left - containerRect.left + dotRect.width / 2;
    const y = dotRect.top - containerRect.top + dotRect.height / 2;
    const flipX = x > containerRect.width / 2;
    tip.textContent = sentences[i] ?? '';
    if (flipX) {
      tip.style.left = 'auto';
      tip.style.right = `${containerRect.width - x + 18}px`;
    } else {
      tip.style.right = 'auto';
      tip.style.left = `${x + 18}px`;
    }
    tip.style.top = `${Math.max(4, y - 12)}px`;
    tip.style.opacity = '1';
  };

  const hideTooltip = () => {
    const tip = tooltipRef.current;
    if (tip) tip.style.opacity = '0';
  };

  const ringLabels: { r: number; label: string }[] = [
    { r: RING_HIGH, label: 'high similarity' },
    { r: RING_MID, label: 'medium' },
    { r: RING_LOW, label: 'low' },
  ];

  return (
    <div className="border border-rule bg-paper p-4">
      <div className="mb-1 font-mono text-xs uppercase tracking-[0.18em] text-muted">
        Similarity circle — closer = more similar to query
      </div>
      <p className="mb-4 text-xs text-muted">
        Distance from center = how different the meaning is.
      </p>
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: H }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
        >
          {ringLabels.map(({ r }) => (
            <circle
              key={`ring${r}`}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.12}
            />
          ))}
          {ringLabels.map(({ r, label }) => {
            const labelY = CY + r + 16;
            const pillW = label.length * 6 + 12;
            const pillH = 14;
            return (
              <g key={`ringlabel${r}`}>
                <rect
                  x={CX - pillW / 2}
                  y={labelY - 10}
                  width={pillW}
                  height={pillH}
                  rx={3}
                  fill="white"
                  opacity={0.08}
                />
                <text
                  x={CX}
                  y={labelY}
                  textAnchor="middle"
                  className="fill-current font-mono text-[10px] text-muted"
                  opacity={0.7}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {items.map((it) => {
            const stroke = it.score >= 0.3 ? SIM_COLORS.high : SIM_COLORS.mid;
            const opacity = Math.max(0.1, Math.min(1, it.score));
            return (
              <line
                key={`conn${it.idx}`}
                x1={CX}
                y1={CY}
                x2={it.cx}
                y2={it.cy}
                stroke={stroke}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                opacity={opacity}
              />
            );
          })}

          <g>
            <circle
              cx={CX}
              cy={CY}
              r={QUERY_R}
              className="fill-accent"
              stroke="white"
              strokeWidth={2}
              onMouseEnter={showTooltip(0)}
              onMouseLeave={hideTooltip}
              style={{ cursor: 'pointer' }}
            />
            <text
              x={CX}
              y={CY + 4}
              textAnchor="middle"
              className="pointer-events-none fill-white font-mono text-[12px] font-semibold"
            >
              ★
            </text>
          </g>

          {items.map((it) => {
            const fill = colorForScore(it.score);
            const truncated = truncate(it.text, 24);
            return (
              <g key={`dot${it.idx}`}>
                <g
                  onMouseEnter={showTooltip(it.idx)}
                  onMouseLeave={hideTooltip}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={it.cx}
                    cy={it.cy}
                    r={DOT_R}
                    fill={fill}
                    stroke="white"
                    strokeWidth={2}
                  />
                </g>
                <text
                  x={it.labelX}
                  y={it.labelY - 2}
                  textAnchor={it.anchor}
                  className="pointer-events-none fill-current font-mono text-[11px]"
                >
                  {truncated}
                </text>
                <text
                  x={it.labelX}
                  y={it.labelY + 12}
                  textAnchor={it.anchor}
                  className="pointer-events-none fill-current font-mono text-[11px] text-muted"
                  opacity={0.7}
                >
                  {it.score.toFixed(3)}
                </text>
              </g>
            );
          })}
        </svg>

        <div
          ref={tooltipRef}
          className="pointer-events-none absolute max-w-[240px] rounded bg-black/85 px-2 py-1.5 text-[12px] leading-snug text-white shadow-lg"
          style={{
            opacity: 0,
            transition: 'opacity 0.15s ease-out',
            zIndex: 50,
            left: 0,
            top: 0,
          }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 font-mono text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          query
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: SIM_COLORS.high }}
          />
          high similarity (≥ 0.3)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: SIM_COLORS.mid }}
          />
          medium (≥ 0.1)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: SIM_COLORS.low }}
          />
          low (&lt; 0.1)
        </span>
      </div>
    </div>
  );
});

function ExplainerBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-rule bg-paper/40 p-4">
      <h3 className="mb-1.5 font-serif text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-foreground/80">{body}</p>
    </div>
  );
}

function shortPhrase(s: string): string {
  return truncate(s, 50);
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

function heatmapColor(value: number, absMax: number): string {
  const t = Math.max(-1, Math.min(1, value / absMax));
  if (t >= 0) {
    const mix = t;
    const r = Math.round(245 + (200 - 245) * mix);
    const g = Math.round(245 + (40 - 245) * mix);
    const b = Math.round(245 + (60 - 245) * mix);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const mix = -t;
  const r = Math.round(245 + (40 - 245) * mix);
  const g = Math.round(245 + (90 - 245) * mix);
  const b = Math.round(245 + (200 - 245) * mix);
  return `rgb(${r}, ${g}, ${b})`;
}

type InferenceRun = {
  index: number;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  tokens_per_second: number;
  answer: string;
};
type InferenceResponse = {
  provider: string;
  model: string;
  runs: InferenceRun[];
  avg_latency_ms: number;
  avg_tokens_per_second: number;
};

function NodeInference() {
  const [prompt, setPrompt] = useState(
    'In one sentence, what is inference in LLMs?',
  );
  const [provider, setProvider] = useState('openai');
  const [runs, setRuns] = useState(2);
  const [result, setResult] = useState<InferenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vizRef = useRef<InferenceVisualizerHandle | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    vizRef.current?.start(prompt, provider);
    try {
      const r = await fetch('http://localhost:8000/day02/inference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider, runs }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      const data = (await r.json()) as InferenceResponse;
      setResult(data);
      vizRef.current?.streamAnswer(data.runs[0]?.answer ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const maxLatency = result
    ? Math.max(...result.runs.map((r) => r.latency_ms))
    : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Inference"
        hint="Same prompt, run N times. See latency and tokens-per-second per call."
      />
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">
            Provider
          </span>
          <ModelSwitcher
            selected={provider}
            onChange={setProvider}
            disabled={loading}
          />
        </div>
        <textarea aria-label="Form input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          rows={3}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <div className="flex items-center gap-3">
          <label className="font-mono text-xs uppercase tracking-wide text-muted">
            Runs
          </label>
          <select aria-label="Number of runs"
            value={runs}
            onChange={(e) => setRuns(Number(e.target.value))}
            disabled={loading === true}
            className="rounded-none border border-rule bg-paper px-2.5 py-1 font-mono text-xs uppercase tracking-wide focus:border-accent focus:outline-none"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="border border-foreground bg-foreground px-5 py-2 font-mono text-xs uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
          >
            {loading ? 'Running…' : 'Run →'}
          </button>
        </div>
      </form>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Avg latency (ms)" value={result.avg_latency_ms} highlight />
            <Stat label="Avg tok/sec" value={result.avg_tokens_per_second} />
          </div>
          <ol className="space-y-2">
            {result.runs.map((r) => {
              const pct = maxLatency
                ? (r.latency_ms / maxLatency) * 100
                : 0;
              return (
                <li key={r.index} className="border border-rule bg-paper p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-muted">
                      Run {String(r.index).padStart(2, '0')}
                    </span>
                    <div className="flex gap-4 font-mono text-xs">
                      <span>
                        {r.latency_ms} <span className="text-muted">ms</span>
                      </span>
                      <span>
                        {r.tokens_per_second}{' '}
                        <span className="text-muted">tok/s</span>
                      </span>
                      <span className="text-muted">
                        {r.prompt_tokens}+{r.completion_tokens} tok
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-[2px] w-full bg-rule">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">
                    {r.answer}
                  </p>
                </li>
              );
            })}
          </ol>
          <Footer>
            {result.provider} · {result.model} · {result.runs.length} runs
          </Footer>
        </div>
      )}
      <InferenceVisualizer controllerRef={vizRef} />
    </div>
  );
}

type InferenceVisualizerHandle = {
  start: (prompt: string, provider: string) => void;
  streamAnswer: (text: string) => void;
  reset: () => void;
};

function InferenceVisualizer({
  controllerRef,
}: {
  controllerRef: React.RefObject<InferenceVisualizerHandle | null>;
}) {
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);
  const step6Ref = useRef<HTMLDivElement>(null);

  const tokensRef = useRef<HTMLDivElement>(null);
  const idsRef = useRef<HTMLDivElement>(null);
  const idsNoteRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const layerCounterRef = useRef<HTMLDivElement>(null);
  const layerBarRef = useRef<HTMLDivElement>(null);
  const candidatesRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const step6ReadyRef = useRef(false);
  const pendingAnswerRef = useRef<string | null>(null);
  const idsRequestIdRef = useRef(0);

  const clearTimers = () => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  };

  const reveal = (el: HTMLDivElement | null) => {
    if (!el) return;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  };

  const hide = (el: HTMLDivElement | null) => {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
  };

  const hideAll = () => {
    [step1Ref, step2Ref, step3Ref, step4Ref, step5Ref, step6Ref].forEach((r) =>
      hide(r.current),
    );
  };

  const tokenizePrompt = (text: string): string[] => {
    const matches = text.match(/\w+|[^\s\w]/g);
    return matches ?? [];
  };

  const renderTokens = (tokens: string[]) => {
    const host = tokensRef.current;
    if (!host) return;
    host.innerHTML = '';
    tokens.forEach((t, i) => {
      const span = document.createElement('span');
      const palette = CHIP_PALETTE[i % CHIP_PALETTE.length];
      span.className =
        'mr-1 mb-1 inline-block rounded px-1.5 py-0.5 font-mono text-[12px] ' +
        palette;
      span.textContent = t;
      host.appendChild(span);
    });
  };

  const renderIdsLoading = () => {
    const host = idsRef.current;
    if (!host) return;
    host.innerHTML = '';
    const loading = document.createElement('span');
    loading.className = 'font-mono text-[11px] text-muted';
    loading.textContent = 'Fetching real IDs…';
    host.appendChild(loading);
  };

  const renderRealIds = (ids: number[]) => {
    const host = idsRef.current;
    if (!host) return;
    host.innerHTML = '';
    for (const id of ids) {
      const span = document.createElement('span');
      span.className =
        'mr-1 mb-1 inline-block rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[11px] text-foreground/75';
      span.textContent = String(id);
      host.appendChild(span);
    }
  };

  const fetchTokenIds = (promptText: string, providerName: string) => {
    const reqId = ++idsRequestIdRef.current;
    renderIdsLoading();
    if (idsNoteRef.current) idsNoteRef.current.textContent = '';
    fetch('http://localhost:8000/day02/tokenize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: promptText, provider: providerName }),
    })
      .then((r) => r.json())
      .then((data: { ids?: number[]; note?: string }) => {
        if (reqId !== idsRequestIdRef.current) return;
        renderRealIds(data.ids ?? []);
        if (idsNoteRef.current) idsNoteRef.current.textContent = data.note ?? '';
      })
      .catch(() => {
        if (reqId !== idsRequestIdRef.current) return;
        if (idsRef.current) idsRef.current.innerHTML = '';
        if (idsNoteRef.current) {
          idsNoteRef.current.textContent = 'Could not fetch real IDs';
        }
      });
  };

  const renderEmbed = () => {
    const host = embedRef.current;
    if (!host) return;
    const floats = Array.from({ length: 6 }, () =>
      (Math.random() * 2 - 1).toFixed(3),
    );
    host.textContent = `[${floats.join(', ')}, …] ×1536`;
  };

  const animateLayers = () => {
    let n = 1;
    const tick = () => {
      if (layerCounterRef.current) {
        layerCounterRef.current.textContent = `Layer ${n}/12`;
      }
      if (layerBarRef.current) {
        layerBarRef.current.style.width = `${(n / 12) * 100}%`;
      }
      if (n < 12) {
        n += 1;
        timersRef.current.push(setTimeout(tick, 120));
      }
    };
    tick();
  };

  const renderCandidates = (promptText: string) => {
    const host = candidatesRef.current;
    if (!host) return;
    host.innerHTML = '';
    const trimmed = promptText.trim();
    const lastWord = trimmed
      ? (trimmed.split(/\s+/).pop() ?? '').replace(/[^\w]/g, '').toLowerCase()
      : '';
    const pool = [
      lastWord ? `${lastWord}…` : 'next',
      'is',
      'means',
      'the',
      'predicting',
      'running',
    ];
    const picks: string[] = [];
    while (picks.length < 3) {
      const w = pool[Math.floor(Math.random() * pool.length)];
      if (!picks.includes(w)) picks.push(w);
    }
    const scores = [
      0.42 + Math.random() * 0.18,
      0.18 + Math.random() * 0.15,
      0.05 + Math.random() * 0.1,
    ];
    picks.forEach((word, i) => {
      const row = document.createElement('div');
      row.className = 'mt-1.5 flex items-center gap-3';
      const wordSpan = document.createElement('span');
      wordSpan.className = 'w-24 truncate font-mono text-[12px]';
      wordSpan.textContent = word;
      const barWrap = document.createElement('div');
      barWrap.className = 'h-[6px] flex-1 bg-rule';
      const barFill = document.createElement('div');
      barFill.className = 'h-full bg-accent';
      barFill.style.width = `${scores[i] * 100}%`;
      barWrap.appendChild(barFill);
      const score = document.createElement('span');
      score.className = 'w-14 text-right font-mono text-[10px] text-muted';
      score.textContent = scores[i].toFixed(3);
      row.appendChild(wordSpan);
      row.appendChild(barWrap);
      row.appendChild(score);
      host.appendChild(row);
    });
  };

  const streamAnswerNow = (text: string) => {
    const host = outputRef.current;
    if (!host) return;
    host.textContent = '';
    const parts = text.split(/(\s+)/);
    let i = 0;
    const tick = () => {
      if (!outputRef.current || i >= parts.length) return;
      outputRef.current.textContent =
        (outputRef.current.textContent ?? '') + parts[i];
      i += 1;
      timersRef.current.push(setTimeout(tick, 35));
    };
    tick();
  };

  useImperativeHandle(
    controllerRef,
    () => ({
      start(promptText: string, providerName: string) {
        clearTimers();
        step6ReadyRef.current = false;
        pendingAnswerRef.current = null;
        hideAll();
        if (outputRef.current) outputRef.current.textContent = '';

        const tokens = tokenizePrompt(promptText);
        renderTokens(tokens);
        fetchTokenIds(promptText, providerName);
        renderEmbed();

        timersRef.current.push(setTimeout(() => reveal(step1Ref.current), 50));
        timersRef.current.push(setTimeout(() => reveal(step2Ref.current), 600));
        timersRef.current.push(
          setTimeout(() => reveal(step3Ref.current), 1100),
        );
        timersRef.current.push(
          setTimeout(() => {
            reveal(step4Ref.current);
            animateLayers();
          }, 1600),
        );
        timersRef.current.push(
          setTimeout(() => {
            reveal(step5Ref.current);
            renderCandidates(promptText);
          }, 3200),
        );
        timersRef.current.push(
          setTimeout(() => {
            reveal(step6Ref.current);
            step6ReadyRef.current = true;
            if (pendingAnswerRef.current !== null) {
              const queued = pendingAnswerRef.current;
              pendingAnswerRef.current = null;
              streamAnswerNow(queued);
            }
          }, 3700),
        );
      },
      streamAnswer(text: string) {
        if (!step6ReadyRef.current) {
          pendingAnswerRef.current = text;
          return;
        }
        streamAnswerNow(text);
      },
      reset() {
        clearTimers();
        step6ReadyRef.current = false;
        pendingAnswerRef.current = null;
        hideAll();
        if (outputRef.current) outputRef.current.textContent = '';
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <div className="space-y-3 border-t border-rule pt-6">
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
        How inference works — step by step
      </div>
      <StepBox stepRef={step1Ref} num={1} title="Tokenize">
        <p className="mb-2 text-xs text-muted">
          Split the prompt into discrete units the model can read.
        </p>
        <div ref={tokensRef} className="flex flex-wrap" />
      </StepBox>
      <StepBox stepRef={step2Ref} num={2} title="Token IDs">
        <p className="mb-2 text-xs text-muted">
          Each token maps to an integer in the model&apos;s vocabulary.
        </p>
        <div ref={idsRef} className="flex flex-wrap" />
        <div
          ref={idsNoteRef}
          className="mt-2 font-mono text-[11px] italic text-muted"
        />
      </StepBox>
      <StepBox stepRef={step3Ref} num={3} title="Embedding lookup">
        <p className="mb-2 text-xs text-muted">
          Each ID becomes a 1,536-dim vector. Sample of the first few:
        </p>
        <div
          ref={embedRef}
          className="rounded border border-rule bg-paper px-3 py-2 font-mono text-[12px] text-foreground/80"
        />
      </StepBox>
      <StepBox stepRef={step4Ref} num={4} title="Transformer layers">
        <p className="mb-2 text-xs text-muted">
          Stacked attention + MLP blocks refine the representation.
        </p>
        <div className="flex items-center gap-3">
          <div
            ref={layerCounterRef}
            className="w-20 font-mono text-xs text-foreground/80"
          >
            Layer 1/12
          </div>
          <div className="h-[6px] flex-1 bg-rule">
            <div
              ref={layerBarRef}
              className="h-full bg-accent"
              style={{ width: '0%', transition: 'width 110ms linear' }}
            />
          </div>
        </div>
      </StepBox>
      <StepBox stepRef={step5Ref} num={5} title="Logits → sampling">
        <p className="mb-2 text-xs text-muted">
          Top candidates for the next token, with their probabilities.
        </p>
        <div ref={candidatesRef} />
      </StepBox>
      <StepBox stepRef={step6Ref} num={6} title="Output (live)">
        <p className="mb-2 text-xs text-muted">
          The model&apos;s actual response, streamed word by word.
        </p>
        <div
          ref={outputRef}
          className="min-h-[3em] rounded border border-rule bg-paper px-3 py-2 text-[14px] leading-relaxed text-foreground/90"
        />
      </StepBox>
    </div>
  );
}

function StepBox({
  stepRef,
  num,
  title,
  children,
}: {
  stepRef: React.RefObject<HTMLDivElement | null>;
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={stepRef}
      className="border border-rule bg-paper/60 p-3"
      style={{
        opacity: 0,
        transform: 'translateY(8px)',
        transition: 'opacity 400ms ease-out, transform 400ms ease-out',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center border border-accent bg-accent font-mono text-[10px] font-semibold text-white">
          {num}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Step {num} · {title}
        </span>
      </div>
      {children}
    </div>
  );
}

type DemoDoc = { text: string; vec: string };
type DemoMatch = { docIndex: number; score: number };
type DemoData = {
  docs: DemoDoc[];
  query: string;
  queryVec: string;
  matches: DemoMatch[];
};

const DEFAULT_DEMO: DemoData = {
  docs: [
    { text: 'Cats are popular household pets.', vec: '[0.12, -0.87, 0.34 … ×1536]' },
    { text: 'RAG combines search with LLMs.', vec: '[0.91, 0.22, -0.61 … ×1536]' },
    { text: 'Vector DBs store embeddings.', vec: '[0.88, 0.31, -0.55 … ×1536]' },
    { text: 'Stock markets fluctuate daily.', vec: '[-0.44, 0.71, 0.18 … ×1536]' },
  ],
  query: 'How does RAG use vector search?',
  queryVec: '[0.89, 0.28, -0.58 … ×1536]',
  matches: [
    { docIndex: 1, score: 0.912 },
    { docIndex: 2, score: 0.887 },
  ],
};

function formatVecPreview(v: number[]): string {
  if (!v || !v.length) return '[…]';
  const head = v
    .slice(0, 3)
    .map((x) => x.toFixed(2))
    .join(', ');
  return `[${head} … ×${v.length}]`;
}

function loadDemoData(): DemoData {
  if (typeof window === 'undefined') return DEFAULT_DEMO;
  try {
    const raw = window.sessionStorage.getItem('day02-embed-result');
    if (!raw) return DEFAULT_DEMO;
    const saved = JSON.parse(raw) as {
      texts?: string[];
      vectors?: number[][];
      similarity_ranking?: { text: string; score: number }[];
    };
    const texts = saved.texts ?? [];
    const vectors = saved.vectors ?? [];
    if (texts.length < 5 || vectors.length < 5) return DEFAULT_DEMO;
    const docs: DemoDoc[] = [];
    for (let i = 1; i < 5; i++) {
      docs.push({ text: texts[i], vec: formatVecPreview(vectors[i]) });
    }
    const ranked = [...(saved.similarity_ranking ?? [])].sort(
      (a, b) => b.score - a.score,
    );
    const matches: DemoMatch[] = [];
    for (const r of ranked.slice(0, 2)) {
      const idx = docs.findIndex((d) => d.text === r.text);
      if (idx >= 0) matches.push({ docIndex: idx, score: r.score });
    }
    if (matches.length < 2) return DEFAULT_DEMO;
    return {
      docs,
      query: texts[0],
      queryVec: formatVecPreview(vectors[0]),
      matches,
    };
  } catch {
    return DEFAULT_DEMO;
  }
}

function VectorSearchDemo() {
  const docRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const docTextRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const docVecRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const slotRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const slotVecRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const embedArrowRef = useRef<HTMLDivElement>(null);
  const searchArrowRef = useRef<HTMLDivElement>(null);
  const queryBoxRef = useRef<HTMLDivElement>(null);
  const queryTextRef = useRef<HTMLDivElement>(null);
  const queryVecRef = useRef<HTMLDivElement>(null);
  const resultBoxRef = useRef<HTMLDivElement>(null);
  const resultListRef = useRef<HTMLDivElement>(null);
  const insightRef = useRef<HTMLDivElement>(null);
  const runIdRef = useRef(0);

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const reveal = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.opacity = '1';
    el.style.transform = 'translateX(0)';
  };

  const hide = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateX(-8px)';
  };

  const setMatchHighlight = (el: HTMLElement | null, on: boolean) => {
    if (!el) return;
    if (on) {
      el.style.borderColor = 'rgb(16, 185, 129)';
      el.style.backgroundColor = 'rgba(16, 185, 129, 0.10)';
    } else {
      el.style.borderColor = '';
      el.style.backgroundColor = '';
    }
  };

  const clearDom = () => {
    for (const r of docRefs) hide(r.current);
    for (const r of slotVecRefs) hide(r.current);
    for (const r of docRefs) setMatchHighlight(r.current, false);
    for (const r of slotRefs) setMatchHighlight(r.current, false);
    hide(embedArrowRef.current);
    hide(searchArrowRef.current);
    hide(queryBoxRef.current);
    hide(resultBoxRef.current);
    hide(insightRef.current);
    if (resultListRef.current) resultListRef.current.innerHTML = '';
  };

  const populateText = (data: DemoData) => {
    for (let i = 0; i < 4; i++) {
      const doc = data.docs[i];
      if (docTextRefs[i].current) {
        docTextRefs[i].current!.textContent = doc.text;
      }
      if (docVecRefs[i].current) {
        docVecRefs[i].current!.textContent = doc.vec;
      }
      if (slotVecRefs[i].current) {
        slotVecRefs[i].current!.textContent = doc.vec;
      }
    }
    if (queryTextRef.current) queryTextRef.current.textContent = data.query;
    if (queryVecRef.current) queryVecRef.current.textContent = data.queryVec;
  };

  const populateResults = (data: DemoData) => {
    const host = resultListRef.current;
    if (!host) return;
    host.innerHTML = '';
    data.matches.forEach((m, i) => {
      const row = document.createElement('div');
      row.className = 'text-xs leading-snug text-foreground/90';
      row.style.whiteSpace = 'normal';
      row.style.wordBreak = 'break-word';
      const num = document.createElement('span');
      num.className = 'mr-1 font-mono text-foreground/70';
      num.textContent = `${i + 1}.`;
      const text = document.createElement('span');
      text.textContent = data.docs[m.docIndex].text;
      const score = document.createElement('span');
      score.className = 'ml-1.5 font-mono text-emerald-400';
      score.textContent = m.score.toFixed(3);
      row.appendChild(num);
      row.appendChild(text);
      row.appendChild(score);
      host.appendChild(row);
    });
    const tail = document.createElement('div');
    tail.className = 'mt-2 text-[11px] italic text-muted';
    tail.textContent =
      'These chunks are passed to the LLM as context →';
    host.appendChild(tail);
  };

  const onReset = () => {
    runIdRef.current += 1;
    clearDom();
  };

  const onRun = async () => {
    runIdRef.current += 1;
    const myId = runIdRef.current;
    clearDom();
    const data = loadDemoData();
    populateText(data);

    await sleep(50);
    if (myId !== runIdRef.current) return;

    for (let i = 0; i < 4; i++) {
      reveal(docRefs[i].current);
      if (i < 3) {
        await sleep(180);
        if (myId !== runIdRef.current) return;
      }
    }

    await sleep(400);
    if (myId !== runIdRef.current) return;
    reveal(embedArrowRef.current);
    for (let i = 0; i < 4; i++) {
      reveal(slotVecRefs[i].current);
      if (i < 3) {
        await sleep(220);
        if (myId !== runIdRef.current) return;
      }
    }

    await sleep(500);
    if (myId !== runIdRef.current) return;
    reveal(searchArrowRef.current);
    reveal(queryBoxRef.current);

    await sleep(600);
    if (myId !== runIdRef.current) return;
    for (const m of data.matches) {
      setMatchHighlight(docRefs[m.docIndex].current, true);
      setMatchHighlight(slotRefs[m.docIndex].current, true);
    }

    await sleep(400);
    if (myId !== runIdRef.current) return;
    populateResults(data);
    reveal(resultBoxRef.current);

    await sleep(400);
    if (myId !== runIdRef.current) return;
    reveal(insightRef.current);
  };

  const hiddenStyle: React.CSSProperties = {
    opacity: 0,
    transform: 'translateX(-8px)',
    transition: 'opacity 300ms ease-out, transform 300ms ease-out, border-color 300ms ease-out, background-color 300ms ease-out',
  };

  const matchableStyle: React.CSSProperties = {
    transition:
      'border-color 300ms ease-out, background-color 300ms ease-out',
  };

  return (
    <section className="space-y-4 border-t border-rule pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">
            How vector search works
          </h3>
          <p className="text-xs text-muted">
            A visual run-through of the RAG retrieval step.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRun}
            className="border border-foreground bg-foreground px-4 py-1.5 font-mono text-[11px] uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent"
          >
            Run demo
          </button>
          <button
            type="button"
            onClick={onReset}
            className="border border-rule px-4 py-1.5 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_40px_2fr_40px_3fr] gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            1. Documents
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              ref={docRefs[i]}
              className="rounded-lg border border-rule bg-paper/50 p-2.5"
              style={{ ...hiddenStyle }}
            >
              <div
                ref={docTextRefs[i]}
                className="text-xs leading-snug text-foreground/90"
              />
              <div
                ref={docVecRefs[i]}
                className="mt-1 font-mono text-[10px] text-muted"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center">
          <div
            ref={embedArrowRef}
            className="text-center font-mono text-[10px] uppercase tracking-wide text-muted"
            style={{ ...hiddenStyle }}
          >
            <div className="text-base leading-none text-foreground/60">→</div>
            <div className="mt-1">embed</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            2. Vector database
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              ref={slotRefs[i]}
              className="rounded-lg border border-dashed border-rule bg-paper/30 p-2.5"
              style={{ ...matchableStyle }}
            >
              <div className="font-mono text-[10px] uppercase tracking-wide text-muted">
                slot {i + 1}
              </div>
              <div
                ref={slotVecRefs[i]}
                className="mt-1 font-mono text-[11px] text-foreground/85"
                style={{ ...hiddenStyle }}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center">
          <div
            ref={searchArrowRef}
            className="text-center font-mono text-[10px] uppercase tracking-wide text-muted"
            style={{ ...hiddenStyle }}
          >
            <div className="text-base leading-none text-foreground/60">→</div>
            <div className="mt-1">search</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            3. Query &amp; result
          </div>
          <div
            ref={queryBoxRef}
            className="rounded-lg border border-rule bg-paper/50 p-2.5"
            style={{ ...hiddenStyle, minHeight: 88 }}
          >
            <div className="font-mono text-[10px] uppercase tracking-wide text-muted">
              query
            </div>
            <div
              ref={queryTextRef}
              className="mt-1 text-xs italic leading-snug text-foreground/90"
              style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
            />
            <div
              ref={queryVecRef}
              className="mt-1 font-mono text-[10px] text-muted"
              style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
            />
          </div>
          <div
            ref={resultBoxRef}
            className="rounded-lg bg-paper/50 p-2.5"
            style={{
              ...hiddenStyle,
              borderWidth: 1.5,
              borderStyle: 'solid',
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
            }}
          >
            <div className="font-mono text-[10px] uppercase tracking-wide text-emerald-400">
              top 2 results
            </div>
            <div ref={resultListRef} className="mt-1.5 space-y-1" />
          </div>
        </div>
      </div>

      <div
        ref={insightRef}
        className="border-l-2 border-l-emerald-500 bg-paper/40 px-3 py-2 text-xs leading-relaxed text-muted"
        style={{ ...hiddenStyle }}
      >
        The LLM never searches the documents itself. The vector DB does the
        searching, then hands the most relevant chunks to the LLM as context.
        That is the retrieval part of RAG.
      </div>
    </section>
  );
}
