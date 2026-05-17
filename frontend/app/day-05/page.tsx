'use client';

import { useEffect, useState } from 'react';
import ModelSwitcher from '../components/ModelSwitcher';
import { Markdown } from '../components/Markdown';
import { useNodeProgress } from '../components/useNodeProgress';

const NODES = [
  { id: 'N21', label: 'Pre-trained', title: 'Pre-trained models' },
  { id: 'N22', label: 'Closed vs open', title: 'Closed vs open source' },
  { id: 'N23', label: 'GPT / Gemini', title: 'GPT-4o / Claude / Gemini' },
  { id: 'N24', label: 'Llama / DeepSeek', title: 'Llama / Mistral / DeepSeek' },
  { id: 'N25', label: 'Fine-tuning', title: 'Fine-tuning models' },
];

const VIZ = {
  green: '#1D9E75',
  blue: '#378ADD',
  violet: '#7F77DD',
  amber: '#FAC775',
  coral: '#F5C4B3',
} as const;

const API = 'http://localhost:8000';

export default function Day05Page() {
  const [activeId, setActiveId] = useState('N21');
  const progress = useNodeProgress(5);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 05 · AI Models
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
          Know the <span className="text-accent">model landscape</span>.
        </h1>
        <p className="text-sm text-muted">
          Pre-trained weights, closed vs open source, the big model families,
          and fine-tuning. Each tab is N21–N25.
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
                  ? 'border-accent bg-accent text-white'
                  : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex h-3.5 w-3.5 items-center justify-center border text-[9px] leading-none',
                  done
                    ? active
                      ? 'border-white bg-white text-accent'
                      : 'border-accent bg-accent text-white'
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
              ? 'border-accent bg-accent text-white hover:bg-foreground hover:border-foreground'
              : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
          ].join(' ')}
          suppressHydrationWarning
        >
          <span aria-hidden>{activeIsDone ? '✓' : '○'}</span>
          {activeIsDone ? `${activeId} completed` : `mark ${activeId} complete`}
        </button>
      </div>

      {activeId === 'N21' && <NodePretrained />}
      {activeId === 'N22' && <NodeCompare />}
      {activeId === 'N23' && <NodeClosed />}
      {activeId === 'N24' && <NodeOpen />}
      {activeId === 'N25' && <NodeFineTune />}
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
        Provider
      </span>
      <ModelSwitcher
        selected={provider}
        onChange={onChange}
        disabled={disabled}
      />
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

function Badge({ value, color }: { value: string; color: string }) {
  return (
    <span
      className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
      style={{
        borderColor: color,
        color,
        background: `${color}1F`,
      }}
    >
      {value}
    </span>
  );
}

function kindColor(kind: string) {
  return kind === 'open' ? VIZ.green : VIZ.amber;
}

// ─── N21 — Pre-trained models ─────────────────────────────────────

type PretrainedResponse = {
  question: string;
  answer: string;
  knowledge_type: 'parametric' | 'time_sensitive' | 'private_data';
  why: string;
  prompt_tokens: number;
  completion_tokens: number;
  provider: string;
  model: string;
};

const PRETRAINED_PRESETS = [
  'What is the capital of France, and why is the sky blue?',
  'Who won the most recent Formula 1 race, and what is today’s date?',
  'What were last quarter’s sales figures for my company?',
];

const KTYPE_META: Record<string, { label: string; color: string }> = {
  parametric: { label: 'parametric · in the weights', color: VIZ.green },
  time_sensitive: { label: 'time-sensitive · past cutoff', color: VIZ.amber },
  private_data: { label: 'private data · never trained', color: VIZ.coral },
};

function NodePretrained() {
  const [provider, setProvider] = useState('openai');
  const [question, setQuestion] = useState(PRETRAINED_PRESETS[0]);
  const [result, setResult] = useState<PretrainedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day05/pretrained`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as PretrainedResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const meta = result ? KTYPE_META[result.knowledge_type] : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pre-trained models"
        hint="A pre-trained model is frozen knowledge — everything it learned during training, with nothing newer and nothing private. Ask something and watch it judge whether the answer is already in its weights."
      />
      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <PresetRow
          presets={PRETRAINED_PRESETS}
          onPick={setQuestion}
          disabled={loading}
          labelPrefix="question"
        />
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          rows={2}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <SubmitButton
          loading={loading}
          idle="Ask the frozen model →"
          busy="Asking…"
          disabled={loading || !question.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3">
          {meta && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge value={meta.label} color={meta.color} />
              <span className="text-sm text-muted">{result.why}</span>
            </div>
          )}
          <div className="border border-rule border-l-2 border-l-accent bg-paper p-4 text-[14px] leading-relaxed text-foreground/90">
            <Markdown text={result.answer} />
          </div>
          <Footer>
            {result.provider} · {result.model} · {result.prompt_tokens}+
            {result.completion_tokens} tok
          </Footer>
        </div>
      )}

      {result && (
        <KnowledgeTimeline
          key={result.question ?? question}
          question={result.question ?? question}
        />
      )}

      <ExplainerBlock
        title="Pre-training is frozen knowledge"
        body="Training bakes patterns from a giant text corpus into the model's weights once. After that the weights never change — so the model answers stable facts confidently (parametric), guesses or refuses on anything past its training cutoff (time-sensitive), and can never know your private data. That gap is exactly why RAG and tools exist: they feed fresh or private context in at runtime without retraining."
      />
    </div>
  );
}

const TL_GREEN = '#1D9E75';
const TL_RED = '#E24B4A';
const TL_AMBER = '#FAC775';
const TL_BLUE = '#B5D4F4';
const TL_VIOLET = '#CECBF6';

const TIME_KEYWORDS = [
  'recent',
  'latest',
  'today',
  'now',
  'current',
  'this year',
  'this week',
  'this month',
  'tonight',
  'yesterday',
  'price',
  'score',
  'news',
  'weather',
  'stock',
  'winner',
  'who won',
];

const PRIVATE_KEYWORDS = ['my', 'our', 'company', 'internal', 'private'];

type ClauseClass = 'parametric' | 'time_sensitive' | 'private';

function splitClauses(question: string | null | undefined): string[] {
  return (question ?? '')
    .split(/,|\band\b|\?|;/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function classifyClause(clause: string): ClauseClass {
  const c = clause.toLowerCase();
  if (TIME_KEYWORDS.some((k) => c.includes(k))) return 'time_sensitive';
  if (PRIVATE_KEYWORDS.some((k) => c.includes(k))) return 'private';
  return 'parametric';
}

function TimelineItem({
  text,
  pill,
  color,
}: {
  text: string;
  pill: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 border p-3"
      style={{ borderColor: color, background: `${color}1F` }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        <span className="text-[13px] text-foreground/90">{text}</span>
      </div>
      <span
        className="shrink-0 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
        style={{ borderColor: color, color, background: `${color}1F` }}
      >
        {pill}
      </span>
    </div>
  );
}

function GapCard({
  title,
  body,
  color,
}: {
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div
      className="space-y-1.5 border bg-paper p-4"
      style={{ borderColor: color }}
    >
      <div
        className="font-mono text-[11px] uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {title}
      </div>
      <p className="text-[13px] leading-relaxed text-foreground/80">{body}</p>
    </div>
  );
}

function KnowledgeTimeline({
  question,
}: {
  question: string | null | undefined;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const classified = splitClauses(question).map((text) => ({
    text,
    cls: classifyClause(text),
  }));
  const greenItems = classified.filter((c) => c.cls === 'parametric');
  const redItems = classified.filter((c) => c.cls !== 'parametric');

  return (
    <div
      className="border-t border-rule pt-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
    >
      <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        Knowledge timeline
      </div>

      <div>
        <div
          className="space-y-3 pl-4"
          style={{ borderLeft: `2px solid ${TL_GREEN}` }}
        >
          <div
            className="font-mono text-[11px] uppercase tracking-wide"
            style={{ color: TL_GREEN }}
          >
            ✓ Before training cutoff — model knows this
          </div>
          {greenItems.length > 0 ? (
            greenItems.map((it, i) => (
              <TimelineItem
                key={`${i}-${it.text}`}
                text={it.text}
                pill="parametric"
                color={TL_GREEN}
              />
            ))
          ) : (
            <p className="text-[12px] italic text-muted">
              No stable facts detected in this question
            </p>
          )}
        </div>

        <div className="my-4 flex items-center gap-3">
          <div
            className="h-px flex-1"
            style={{ background: TL_AMBER }}
            aria-hidden
          />
          <span
            className="whitespace-nowrap font-mono text-[11px] uppercase tracking-wide"
            style={{ color: TL_AMBER }}
          >
            ✂ Training cutoff — weights frozen here
          </span>
          <div
            className="h-px flex-1"
            style={{ background: TL_AMBER }}
            aria-hidden
          />
        </div>

        <div
          className="space-y-3 pl-4"
          style={{ borderLeft: `2px solid ${TL_RED}` }}
        >
          <div
            className="font-mono text-[11px] uppercase tracking-wide"
            style={{ color: TL_RED }}
          >
            ✗ After cutoff — model guesses or fails
          </div>
          {redItems.length > 0 ? (
            redItems.map((it, i) => (
              <TimelineItem
                key={`${i}-${it.text}`}
                text={it.text}
                pill={
                  it.cls === 'time_sensitive'
                    ? 'hallucination risk'
                    : 'never seen'
                }
                color={TL_RED}
              />
            ))
          ) : (
            <p className="text-[12px] italic text-muted">
              No time-sensitive topics detected
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-rule pt-6">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          How to fill the gap
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <GapCard
            title="RAG"
            body="Retrieve fresh documents at runtime and inject them as context before the model answers."
            color={TL_BLUE}
          />
          <GapCard
            title="Tools / function calling"
            body="Let the model call APIs, search the web, or query databases to get real-time data."
            color={TL_VIOLET}
          />
        </div>
      </div>

      <div
        className="mt-6 bg-paper/40 p-3 text-[13px] leading-relaxed text-foreground/85"
        style={{ borderLeft: `2px solid ${TL_GREEN}`, borderRadius: 8 }}
      >
        <span aria-hidden className="mr-1.5">
          💡
        </span>
        The weights never change after training. Everything the model knows was
        baked in during that phase. RAG and tools exist precisely to bridge
        this gap.
      </div>
    </div>
  );
}

// ─── N22 — Closed vs open source ──────────────────────────────────

type CompareResult = {
  provider: string;
  model: string;
  kind: 'open' | 'closed';
  answer: string;
  latency_ms: number | null;
  prompt_tokens: number;
  completion_tokens: number;
  error: string | null;
};
type CompareResponse = {
  question: string;
  results: CompareResult[];
};

const COMPARE_PROVIDERS = ['openai', 'groq', 'deepseek', 'gemini'];
const PROVIDER_KIND: Record<string, 'open' | 'closed'> = {
  openai: 'closed',
  gemini: 'closed',
  groq: 'open',
  deepseek: 'open',
};

const COMPARE_PRESETS = [
  'Explain what makes a model "open source" in one short paragraph.',
  'Write a haiku about gradient descent.',
  'What are the trade-offs of self-hosting an LLM vs using an API?',
];

function NodeCompare() {
  const [question, setQuestion] = useState(COMPARE_PRESETS[0]);
  const [picked, setPicked] = useState<string[]>(['openai', 'groq']);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePick = (p: string) =>
    setPicked((cur) =>
      cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || picked.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day05/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, providers: picked }),
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
        title="Closed vs open source"
        hint="Send the exact same question to several models at once. Closed models (GPT, Gemini) only exist behind an API; open-weight models (Llama via Groq, DeepSeek) can be downloaded and self-hosted."
      />
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">
            Providers to compare
          </span>
          <div className="flex flex-wrap gap-2">
            {COMPARE_PROVIDERS.map((p) => {
              const on = picked.includes(p);
              const color = kindColor(PROVIDER_KIND[p]);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePick(p)}
                  disabled={loading}
                  className="flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition disabled:opacity-40"
                  style={{
                    borderColor: on ? color : 'var(--rule)',
                    color: on ? color : undefined,
                    background: on ? `${color}14` : undefined,
                  }}
                >
                  <span aria-hidden>{on ? '✓' : '○'}</span>
                  {p}
                  <span className="opacity-60">· {PROVIDER_KIND[p]}</span>
                </button>
              );
            })}
          </div>
        </div>
        <PresetRow
          presets={COMPARE_PRESETS}
          onPick={setQuestion}
          disabled={loading}
          labelPrefix="question"
        />
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          rows={2}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <SubmitButton
          loading={loading}
          idle="Compare models →"
          busy="Comparing…"
          disabled={loading || !question.trim() || picked.length === 0}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {(result || loading) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(result?.results ?? picked.map(() => null)).map((res, i) => {
            const prov = res ? res.provider : picked[i];
            const kind = res ? res.kind : PROVIDER_KIND[prov];
            const color = kindColor(kind);
            return (
              <div
                key={i}
                className="space-y-2 border border-rule bg-paper p-3"
                style={{ borderTop: `2px solid ${color}` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{ color }}
                  >
                    {prov}
                  </div>
                  <Badge value={kind} color={color} />
                </div>
                {res ? (
                  res.error ? (
                    <p className="text-[13px] text-accent">{res.error}</p>
                  ) : (
                    <>
                      <div className="text-[13px] leading-relaxed text-foreground/90">
                        <Markdown text={res.answer} />
                      </div>
                      <Footer>
                        {res.model} ·{' '}
                        {res.latency_ms != null
                          ? `${res.latency_ms} ms`
                          : '—'}{' '}
                        · {res.prompt_tokens}+{res.completion_tokens} tok
                      </Footer>
                    </>
                  )
                ) : (
                  <div className="font-mono text-xs uppercase tracking-wide text-muted">
                    asking…
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ExplainerBlock
        title="Same prompt, different weights"
        body="The only thing that changed between these cards is which company's weights answered. Closed models are usually the most capable but you rent them by the token and can never run them offline. Open-weight models can be downloaded, fine-tuned, and self-hosted — you trade some peak quality for control, privacy, and no per-call vendor bill. Most production systems mix both."
      />
    </div>
  );
}

// ─── N23 / N24 — model family explorers ───────────────────────────

type ModelCard = {
  name: string;
  vendor: string;
  license: string;
  access: string;
  context: string;
  strengths: string;
};

function ModelFamily({
  cards,
  accent,
  askProvider,
  askLabel,
}: {
  cards: ModelCard[];
  accent: string;
  askProvider: string;
  askLabel: string;
}) {
  const [openIdx, setOpenIdx] = useState(0);
  const [provider, setProvider] = useState(askProvider);
  const [question, setQuestion] = useState(
    'In one sentence, what is this model best at?',
  );
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const r = await fetch(`${API}/day05/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setAnswer((await r.json()) as AskResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {cards.map((c, i) => {
          const on = i === openIdx;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => setOpenIdx(i)}
              className="border p-3 text-left transition"
              style={{
                borderColor: on ? accent : 'var(--rule)',
                background: on ? `${accent}14` : undefined,
              }}
            >
              <div
                className="font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: on ? accent : undefined }}
              >
                {c.vendor}
              </div>
              <div className="mt-0.5 font-serif text-base font-semibold">
                {c.name}
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="space-y-2 border border-rule bg-paper p-4"
        style={{ borderLeft: `2px solid ${accent}` }}
      >
        <div className="font-serif text-lg font-semibold">
          {cards[openIdx].name}
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2">
          <CardRow k="Vendor" v={cards[openIdx].vendor} />
          <CardRow k="License" v={cards[openIdx].license} />
          <CardRow k="Access" v={cards[openIdx].access} />
          <CardRow k="Context window" v={cards[openIdx].context} />
        </dl>
        <p className="pt-1 text-[13px] leading-relaxed text-foreground/80">
          {cards[openIdx].strengths}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 border-t border-rule pt-6"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Ask one live — {askLabel}
        </p>
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          rows={2}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <SubmitButton
          loading={loading}
          idle="Ask →"
          busy="Asking…"
          disabled={loading || !question.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}
      {answer && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge value={answer.kind} color={kindColor(answer.kind)} />
            <span className="font-mono text-[11px] text-muted">
              {answer.provider} · {answer.model}
            </span>
          </div>
          <div className="border border-rule border-l-2 border-l-accent bg-paper p-4 text-[14px] leading-relaxed text-foreground/90">
            <Markdown text={answer.answer} />
          </div>
          <Footer>
            {answer.latency_ms} ms · {answer.prompt_tokens}+
            {answer.completion_tokens} tok
          </Footer>
        </div>
      )}
    </div>
  );
}

type AskResponse = {
  question: string;
  answer: string;
  kind: 'open' | 'closed';
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  provider: string;
  model: string;
};

function CardRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted">
        {k}
      </dt>
      <dd className="text-foreground/85">{v}</dd>
    </div>
  );
}

const CLOSED_CARDS: ModelCard[] = [
  {
    name: 'GPT-4o',
    vendor: 'OpenAI',
    license: 'Proprietary — weights never released',
    access: 'API only (also in ChatGPT)',
    context: '128K tokens',
    strengths:
      'Strong general reasoning, reliable tool/function calling, broad multimodal support. The default "it just works" model that this app uses for OpenAI.',
  },
  {
    name: 'Claude',
    vendor: 'Anthropic',
    license: 'Proprietary — weights never released',
    access: 'API only (also in Claude.ai)',
    context: '200K tokens',
    strengths:
      'Long-context analysis, careful instruction-following, strong coding and writing. Known for a measured, safety-conscious style.',
  },
  {
    name: 'Gemini',
    vendor: 'Google',
    license: 'Proprietary — weights never released',
    access: 'API only (also in Gemini app)',
    context: '1M+ tokens',
    strengths:
      'Huge context window, tight Google ecosystem integration, competitive multimodal. This app reaches it through the OpenAI-compatible endpoint.',
  },
];

const OPEN_CARDS: ModelCard[] = [
  {
    name: 'Llama 3',
    vendor: 'Meta',
    license: 'Open weights (community license)',
    access: 'Download & self-host, or hosted (Groq)',
    context: '8K–128K depending on variant',
    strengths:
      'The most widely deployed open family. Huge fine-tuning ecosystem. This app serves it blazing-fast through Groq.',
  },
  {
    name: 'Mistral',
    vendor: 'Mistral AI',
    license: 'Apache 2.0 (open models) + commercial tier',
    access: 'Download & self-host, or hosted API',
    context: '32K+ tokens',
    strengths:
      'Small, efficient models with strong quality-per-parameter. Mixtral popularized mixture-of-experts in the open.',
  },
  {
    name: 'DeepSeek',
    vendor: 'DeepSeek',
    license: 'Open weights (MIT-style)',
    access: 'Download & self-host, or hosted API',
    context: '64K+ tokens',
    strengths:
      'Near-frontier reasoning at a fraction of the cost; a reasoning variant exposes its chain of thought. Used directly in this app.',
  },
];

function NodeClosed() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="GPT-4o / Claude / Gemini"
        hint="The big closed models. You never see the weights — you rent capability through an API. Click a card for details, then ask one live."
      />
      <ModelFamily
        cards={CLOSED_CARDS}
        accent={VIZ.amber}
        askProvider="openai"
        askLabel="pick a closed provider (openai / gemini)"
      />
      <ExplainerBlock
        title="Closed = capability you rent"
        body="GPT-4o, Claude, and Gemini are usually at or near the quality frontier, with polished tool use and multimodal features. The trade-off: the weights stay locked inside the vendor, you pay per token, every request leaves your infrastructure, and the model can change or be retired under you. You're buying a service, not owning an asset."
      />
    </div>
  );
}

function NodeOpen() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Llama / Mistral / DeepSeek"
        hint="Open-weight models you can actually download, inspect, fine-tune, and run on your own hardware. Click a card for details, then ask one live."
      />
      <ModelFamily
        cards={OPEN_CARDS}
        accent={VIZ.green}
        askProvider="groq"
        askLabel="pick an open provider (groq / deepseek)"
      />
      <ExplainerBlock
        title="Open = capability you own"
        body="Open-weight models ship the actual parameters under a permissive-ish license. You can run them offline, fine-tune them on private data, audit their behavior, and pay only for the hardware. The cost: you operate the infrastructure, and the very top of the quality curve still tends to belong to the closed labs. For privacy-sensitive or high-volume workloads the economics often flip in open's favor."
      />
    </div>
  );
}

// ─── N25 — Fine-tuning ────────────────────────────────────────────

type FineTuneSide = {
  answer: string;
  prompt_tokens: number;
  completion_tokens: number;
};
type FineTuneResponse = {
  task: string;
  test_input: string;
  example_count: number;
  base: FineTuneSide;
  tuned: FineTuneSide;
  provider: string;
  model: string;
};

type Example = { input: string; output: string };

const FT_TASK = 'Convert the product note into a strict SKU tag.';
const FT_EXAMPLES: Example[] = [
  { input: 'Red cotton t-shirt, size L', output: 'SKU: TSHIRT-RED-CTN-L' },
  { input: 'Blue denim jeans, size 32', output: 'SKU: JEANS-BLU-DNM-32' },
  { input: 'Black leather belt, size M', output: 'SKU: BELT-BLK-LTR-M' },
];
const FT_TEST = 'Green wool sweater, size S';

function NodeFineTune() {
  const [provider, setProvider] = useState('openai');
  const [task, setTask] = useState(FT_TASK);
  const [examples, setExamples] = useState<Example[]>(FT_EXAMPLES);
  const [testInput, setTestInput] = useState(FT_TEST);
  const [result, setResult] = useState<FineTuneResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setEx = (i: number, key: keyof Example, val: string) =>
    setExamples((cur) =>
      cur.map((e, j) => (j === i ? { ...e, [key]: val } : e)),
    );
  const addEx = () =>
    setExamples((cur) => [...cur, { input: '', output: '' }]);
  const delEx = (i: number) =>
    setExamples((cur) => cur.filter((_, j) => j !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = examples.filter(
      (x) => x.input.trim() && x.output.trim(),
    );
    if (!task.trim() || !testInput.trim() || cleaned.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day05/finetune-vs-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          examples: cleaned,
          test_input: testInput,
          provider,
        }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as FineTuneResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Fine-tuning models"
        hint="Real fine-tuning bakes labeled examples into the weights. Here we simulate it: the LEFT model sees only the instruction; the RIGHT model is conditioned on your examples at runtime — the cheap approximation of a fine-tune."
      />
      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Task instruction
          </span>
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            disabled={loading}
            className="w-full border border-rule bg-paper p-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Training examples ({examples.length})
            </span>
            <button
              type="button"
              onClick={addEx}
              disabled={loading}
              className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              + add
            </button>
          </div>
          {examples.map((ex, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_auto] gap-2"
            >
              <input
                value={ex.input}
                onChange={(e) => setEx(i, 'input', e.target.value)}
                disabled={loading}
                placeholder="input"
                className="border border-rule bg-paper p-2 text-[13px] outline-none focus:border-accent"
              />
              <input
                value={ex.output}
                onChange={(e) => setEx(i, 'output', e.target.value)}
                disabled={loading}
                placeholder="desired output"
                className="border border-rule bg-paper p-2 font-mono text-[12px] outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => delEx(i)}
                disabled={loading || examples.length === 1}
                className="border border-rule px-2 font-mono text-[11px] text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
                aria-label="remove example"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Test input (held out — not in the examples)
          </span>
          <input
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            disabled={loading}
            className="w-full border border-rule bg-paper p-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <SubmitButton
          loading={loading}
          idle="Base vs simulated fine-tune →"
          busy="Running both…"
          disabled={
            loading ||
            !task.trim() ||
            !testInput.trim() ||
            examples.every((x) => !x.input.trim() || !x.output.trim())
          }
        />
      </form>
      {error && <ErrorBox message={error} />}

      {(result || loading) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FineTuneColumn
            label="Base model — instruction only"
            color="#9CA3AF"
            side={result?.base ?? null}
            loading={loading && !result}
          />
          <FineTuneColumn
            label="Simulated fine-tune — conditioned on examples"
            color={VIZ.violet}
            side={result?.tuned ?? null}
            loading={loading && !result}
          />
        </div>
      )}

      {result && (
        <Footer>
          {result.provider} · {result.model} · {result.example_count} examples
          · base {result.base.prompt_tokens}+{result.base.completion_tokens} ·
          tuned {result.tuned.prompt_tokens}+{result.tuned.completion_tokens}{' '}
          tok
        </Footer>
      )}

      <ExplainerBlock
        title="Fine-tuning vs prompting"
        body="Real fine-tuning runs gradient updates so the examples become part of the weights — the model then behaves that way for free on every future call, no examples needed in the prompt. Few-shot prompting (what the right column does) gets a similar effect by pasting examples into every request: zero training cost and instant, but you pay those example tokens every single call and the context window caps how many you can show. Rule of thumb: prototype with prompting, fine-tune only when the pattern is stable, high-volume, and prompting can't hit the quality or latency you need."
      />
    </div>
  );
}

function FineTuneColumn({
  label,
  color,
  side,
  loading,
}: {
  label: string;
  color: string;
  side: FineTuneSide | null;
  loading: boolean;
}) {
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
      {loading ? (
        <div className="font-mono text-xs uppercase tracking-wide text-muted">
          running…
        </div>
      ) : side ? (
        <>
          <div className="text-[13px] leading-relaxed text-foreground/90">
            <Markdown text={side.answer} />
          </div>
          <Footer>
            {side.prompt_tokens}+{side.completion_tokens} tok
          </Footer>
        </>
      ) : null}
    </div>
  );
}
