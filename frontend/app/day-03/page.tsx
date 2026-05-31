'use client';

import { useEffect, useRef, useState } from 'react';
import { AnswerCard } from '../components/Markdown';
import ModelSwitcher from '../components/ModelSwitcher';
import { useNodeProgress } from '../components/useNodeProgress';
import DayPager from '../components/DayPager';
import { useStreamingAsk } from '../components/useStreamingAsk';

const NODES = [
  { id: 'N11', label: 'Basics', title: 'Prompt engineering basics' },
  { id: 'N12', label: 'Zero/Few', title: 'Zero-shot vs Few-shot' },
  { id: 'N13', label: 'CoT', title: 'Chain of Thought' },
  { id: 'N14', label: 'Tools', title: 'Function calling' },
  { id: 'N15', label: 'Cache', title: 'Prompt caching' },
];

export default function Day03Page() {
  const [activeId, setActiveId] = useState('N11');
  const progress = useNodeProgress(3);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 03 · Prompt Engineering
          </p>
          {progress.dayProgress && (
            <span className="border border-rule bg-paper px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide">
              <span className="text-accent">{progress.dayProgress.done}</span>
              <span className="text-muted"> / {progress.dayProgress.total} nodes</span>
            </span>
          )}
        </div>
        <h1 className="text-4xl font-semibold leading-tight">
          From <span className="text-accent">prompting</span> to{' '}
          <span className="text-accent">agents</span>.
        </h1>
        <p className="text-sm text-muted">
          Five hands-on demos. Each tab is N11–N15.
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

      {activeId === 'N11' && <NodeBasics />}
      {activeId === 'N12' && <NodeClassify />}
      {activeId === 'N13' && <NodeCoT />}
      {activeId === 'N14' && <NodeFunctionCalling />}
      {activeId === 'N15' && <NodeCaching />}
      <DayPager day={3} />
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

// ─── N11 ──────────────────────────────────────────────────────────

const N11_DEFAULT_QUESTION =
  'Explain prompt engineering for a complete beginner. Cover: what counts as a prompt, the difference between system and user messages, and the main levers you can pull (instructions, examples, format, constraints).';

function NodeBasics() {
  const [provider, setProvider] = useState('openai');
  const [question, setQuestion] = useState(N11_DEFAULT_QUESTION);
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const stream = useStreamingAsk();
  const loading = stream.status === 'streaming';
  const hasResult = stream.answer.length > 0 || stream.meta !== null;
  const streamDone = !loading && stream.meta !== null;
  const showAnatomy = streamDone && submittedPrompt !== null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSubmittedPrompt(question);
    stream.start({
      url: 'http://localhost:8000/day01/ask/stream',
      body: { question, provider },
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <SectionHeader
          title="Prompt engineering basics"
          hint="What a prompt is, why phrasing matters, and the four levers you actually have."
        />
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
                {stream.meta.promptTokens} prompt +{' '}
                {stream.meta.completionTokens} completion
              </Footer>
            )}
          </div>
        )}
      </div>

      {showAnatomy && submittedPrompt && (
        <PromptAnatomy key={submittedPrompt} userPrompt={submittedPrompt} />
      )}
    </div>
  );
}

type ComponentId =
  | 'system'
  | 'instructions'
  | 'examples'
  | 'format'
  | 'constraints';

type PromptComponent = {
  id: ComponentId;
  color: string;
  label: string;
  desc: string;
  content: string;
};

const PROMPT_COMPONENTS: PromptComponent[] = [
  {
    id: 'system',
    color: '#9FE1CB',
    label: 'system',
    desc: 'Tells the AI who it is and how to behave',
    content: 'You are a helpful assistant that explains things simply.',
  },
  {
    id: 'instructions',
    color: '#FAC775',
    label: 'instructions',
    desc: 'What you want the AI to do, step by step',
    content: 'Explain what RAG is to a complete beginner.',
  },
  {
    id: 'examples',
    color: '#CECBF6',
    label: 'examples',
    desc: 'Show the AI what a good answer looks like',
    content:
      'Good answer: "RAG is like giving the AI a textbook to read before answering."\nBad answer: "RAG stands for Retrieval-Augmented Generation."',
  },
  {
    id: 'format',
    color: '#F5C4B3',
    label: 'format',
    desc: 'Tell the AI how to structure its output',
    content: 'Reply in 3 sentences max. Use plain language, no jargon.',
  },
  {
    id: 'constraints',
    color: '#B5D4F4',
    label: 'constraints',
    desc: 'Limit what the AI can or cannot say',
    content: 'Do not use technical terms. Do not mention neural networks.',
  },
];

const QUALITY_TABLE: { pct: number; label: string }[] = [
  { pct: 0, label: 'Empty — the AI has nothing to work with' },
  { pct: 20, label: 'Very weak — too vague' },
  { pct: 40, label: 'Basic — missing examples and format' },
  { pct: 62, label: 'Good — clear intent and structure' },
  { pct: 80, label: 'Strong — well-guided output' },
  { pct: 100, label: 'Excellent — fully engineered prompt' },
];

function PromptAnatomy({ userPrompt }: { userPrompt: string }) {
  const [enabled, setEnabled] = useState<Record<ComponentId, boolean>>({
    system: true,
    instructions: true,
    examples: false,
    format: false,
    constraints: false,
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const toggle = (id: ComponentId) =>
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));

  const components: PromptComponent[] = PROMPT_COMPONENTS.map((c) => {
    if (c.id === 'system') {
      return {
        ...c,
        content:
          'You are a friendly AI engineering tutor teaching beginners.',
      };
    }
    if (c.id === 'instructions') {
      return { ...c, content: userPrompt };
    }
    return c;
  });

  const activeCount = components.reduce(
    (n, c) => n + (enabled[c.id] ? 1 : 0),
    0,
  );
  const quality = QUALITY_TABLE[activeCount];

  return (
    <section
      className="space-y-4 border-t border-rule pt-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 600ms ease-out, transform 600ms ease-out',
      }}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        Here is how your prompt was structured when sent to the model.
      </p>
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Anatomy of a prompt — toggle each component
        </h3>
        <p className="text-xs text-muted">
          See how each part affects the final prompt sent to the AI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* LEFT — toggles + quality meter */}
        <div className="space-y-3">
          {components.map((c) => (
            <ToggleRow
              key={c.id}
              component={c}
              on={enabled[c.id]}
              onToggle={() => toggle(c.id)}
            />
          ))}

          <div className="mt-4 space-y-2 border border-rule bg-paper p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                Prompt quality
              </span>
              <span className="font-serif text-lg font-semibold tabular-nums">
                {quality.pct}%
              </span>
            </div>
            <div className="h-[8px] w-full overflow-hidden bg-rule">
              <div
                className="h-full bg-emerald-500"
                style={{
                  width: `${quality.pct}%`,
                  transition: 'width 400ms ease-out',
                }}
              />
            </div>
            <p className="text-xs leading-snug text-foreground/80">
              {quality.label}
            </p>
          </div>
        </div>

        {/* RIGHT — live prompt preview */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Live prompt preview
          </div>
          {activeCount === 0 ? (
            <div className="rounded-md border-2 border-dashed border-rule bg-paper/30 px-6 py-10 text-center text-sm text-muted">
              All components off — the AI has nothing to work with 😅
            </div>
          ) : null}
          <div className="space-y-2">
            {PROMPT_COMPONENTS.map((c) => (
              <PreviewBlock
                key={c.id}
                component={c}
                on={enabled[c.id]}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ToggleRow({
  component,
  on,
  onToggle,
}: {
  component: PromptComponent;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start gap-3 border border-rule bg-paper/40 p-3">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        aria-label={`Toggle ${component.label}`}
        className="relative mt-0.5 shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/60"
        style={{
          width: 36,
          height: 20,
          background: on ? '#10b981' : 'rgb(64,64,72)',
          transition: 'background-color 200ms ease-out',
        }}
      >
        <span
          className="absolute top-0.5 block rounded-full bg-white shadow"
          style={{
            width: 16,
            height: 16,
            left: on ? 18 : 2,
            transition: 'left 200ms ease-out',
          }}
        />
      </button>
      <div className="flex-1">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.18em]"
          style={{ color: component.color }}
        >
          {component.label}
        </div>
        <p className="mt-0.5 text-xs leading-snug text-foreground/75">
          {component.desc}
        </p>
      </div>
    </div>
  );
}

function PreviewBlock({
  component,
  on,
}: {
  component: PromptComponent;
  on: boolean;
}) {
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        maxHeight: on ? 240 : 0,
        marginBottom: on ? 0 : -8,
        transform: on ? 'translateY(0)' : 'translateY(-4px)',
        transition:
          'opacity 300ms ease-out, max-height 350ms ease-out, transform 300ms ease-out, margin 300ms ease-out',
        overflow: 'hidden',
      }}
    >
      <div
        className="border-l-2 px-3 py-2"
        style={{
          borderLeftColor: component.color,
          background: `${component.color}14`,
        }}
      >
        <div
          className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: component.color }}
        >
          {component.label}
        </div>
        <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-foreground/90">
          {component.content}
        </pre>
      </div>
    </div>
  );
}

// ─── N12 — Zero-shot vs Few-shot ──────────────────────────────────

type ClassifyResponse = {
  technique: 'zero_shot' | 'few_shot';
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  reasoning: string;
  prompt_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  provider: string;
  model: string;
};

const REVIEW_PRESETS = [
  'The packaging was beautiful and the battery lasts forever. Easily my favorite gadget this year.',
  'It does what it says, but the instructions were confusing and the app crashed once.',
  'Three stars only because of fast shipping. The product itself is mediocre at best.',
];

const FALLBACK_REVIEW =
  'The packaging was beautiful and the battery lasts forever.';

function NodeClassify() {
  const [provider, setProvider] = useState('openai');
  const [review, setReview] = useState(REVIEW_PRESETS[0]);
  const [submittedReview, setSubmittedReview] = useState<string | null>(null);
  const [zero, setZero] = useState<ClassifyResponse | null>(null);
  const [few, setFew] = useState<ClassifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showVisual, setShowVisual] = useState(false);

  const runOne = async (
    technique: 'zero_shot' | 'few_shot',
  ): Promise<ClassifyResponse> => {
    const r = await fetch('http://localhost:8000/day03/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review, technique, provider }),
    });
    if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
    return (await r.json()) as ClassifyResponse;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review.trim()) return;
    setLoading(true);
    setError(null);
    setZero(null);
    setFew(null);
    setSubmittedReview(review);
    try {
      const [z, f] = await Promise.all([runOne('zero_shot'), runOne('few_shot')]);
      setZero(z);
      setFew(f);
      setShowVisual(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Zero-shot vs Few-shot"
        hint="Same review, same model, two prompts. The only difference is whether the prompt shows the model a few labeled examples first."
      />
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
        <div className="flex flex-wrap gap-2">
          {REVIEW_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setReview(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              preset {i + 1}
            </button>
          ))}
        </div>
        <textarea aria-label="Form input"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          disabled={loading}
          rows={3}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
          placeholder="Paste a product review…"
        />
        <button
          type="submit"
          disabled={loading || !review.trim()}
          className="border border-foreground bg-foreground px-5 py-2 font-mono text-xs uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
        >
          {loading ? 'Comparing…' : 'Run comparison →'}
        </button>
      </form>
      {error && <ErrorBox message={error} />}

      {(zero || few || loading) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ClassifyColumn
            label="Zero-shot"
            sublabel="no examples — just the task"
            data={zero}
            loading={loading && !zero}
          />
          <ClassifyColumn
            label="Few-shot"
            sublabel="3 labeled examples in the prompt"
            data={few}
            loading={loading && !few}
          />
        </div>
      )}

      {(zero || few) && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            className="font-mono text-xs uppercase tracking-wide text-accent hover:underline"
          >
            {showPrompt ? '▾ hide' : '▸ show'} the actual prompts the model saw
          </button>
          {showPrompt && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <PromptBlock label="Zero-shot prompt" body={zero?.prompt_used ?? ''} />
              <PromptBlock label="Few-shot prompt" body={few?.prompt_used ?? ''} />
            </div>
          )}
        </div>
      )}

      <ExplainerBlock
        title="Why this comparison matters"
        body="Zero-shot trusts the model to know what 'positive' means with no examples. Few-shot gives it 3 worked examples so it can match the pattern. For ambiguous reviews (e.g. faint praise, hidden sarcasm) few-shot usually wins because it anchors the model's idea of each class. Real cost: 3 more example pairs ≈ 80–120 extra prompt tokens per call."
      />

      {showVisual && (
        <ZeroFewShotVisual review={submittedReview ?? FALLBACK_REVIEW} />
      )}
    </div>
  );
}

function ClassifyColumn({
  label,
  sublabel,
  data,
  loading,
}: {
  label: string;
  sublabel: string;
  data: ClassifyResponse | null;
  loading: boolean;
}) {
  return (
    <div className="border border-rule bg-paper p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {label}
          </div>
          <div className="text-xs text-muted">{sublabel}</div>
        </div>
        {data && <SentimentBadge value={data.sentiment} />}
      </div>
      {loading ? (
        <div className="font-mono text-xs uppercase tracking-wide text-muted">
          asking model…
        </div>
      ) : data ? (
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wide text-muted">
              <span>Confidence</span>
              <span>{(data.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="h-[6px] w-full bg-rule">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.max(2, data.confidence * 100)}%` }}
              />
            </div>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {data.reasoning || '(no reasoning returned)'}
          </p>
          <Footer>
            {data.provider} · {data.model} · {data.prompt_tokens}+
            {data.completion_tokens} tok
          </Footer>
        </div>
      ) : null}
    </div>
  );
}

function SentimentBadge({ value }: { value: 'positive' | 'negative' | 'neutral' }) {
  const styles: Record<string, string> = {
    positive: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
    negative: 'border-accent bg-accent/10 text-accent',
    neutral: 'border-rule bg-paper text-foreground/70',
  };
  return (
    <span
      className={[
        'border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide',
        styles[value],
      ].join(' ')}
    >
      {value}
    </span>
  );
}

function PromptBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="border border-rule bg-paper/60 p-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground/80">
        {body}
      </pre>
    </div>
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

const ZERO_FEW_EXAMPLES = [
  { text: '"Great product, love it!"', label: 'Positive' },
  { text: '"Broke after one week."', label: 'Negative' },
  { text: '"It works as expected."', label: 'Neutral' },
];

function ZeroFewShotVisual({ review }: { review: string }) {
  const [mode, setMode] = useState<'zero' | 'few'>('zero');
  const [revealedExamples, setRevealedExamples] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];

    if (mode === 'few') {
      setRevealedExamples([false, false, false]);
      for (let i = 0; i < ZERO_FEW_EXAMPLES.length; i++) {
        const t = setTimeout(
          () => {
            setRevealedExamples((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          },
          150 * (i + 1),
        );
        timersRef.current.push(t);
      }
    } else {
      setRevealedExamples([false, false, false]);
    }

    return () => {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
    };
  }, [mode]);

  return (
    <section
      className="space-y-4 border-t border-rule pt-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
    >
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          What changes between Zero-shot and Few-shot?
        </h3>
        <p className="text-xs text-muted">
          Same model, same review — only the prompt is different.
        </p>
      </div>

      <div className="flex gap-2">
        {(['zero', 'few'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="border border-rule px-4 py-1.5 font-mono text-xs uppercase tracking-wide transition"
            style={{ opacity: mode === m ? 1 : 0.5 }}
          >
            {m === 'zero' ? 'Zero-shot' : 'Few-shot'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* LEFT — Prompt sent to model */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Prompt sent to model
          </div>
          <div className="space-y-2 border border-rule bg-paper p-3">
            <PromptPart
              color="#9FE1CB"
              label="system"
              body="Classify sentiment as Positive, Negative, or Neutral."
            />

            {ZERO_FEW_EXAMPLES.map((ex, i) => {
              const on = mode === 'few' && revealedExamples[i];
              return (
                <div
                  key={i}
                  style={{
                    opacity: on ? 1 : 0,
                    maxHeight: on ? 120 : 0,
                    marginTop: on ? undefined : -8,
                    transform: on ? 'translateY(0)' : 'translateY(-4px)',
                    overflow: 'hidden',
                    transition:
                      'opacity 300ms ease-out, max-height 350ms ease-out, transform 300ms ease-out, margin 300ms ease-out',
                  }}
                >
                  <PromptPart
                    color="#22c55e"
                    label={`example ${i + 1}`}
                    body={`${ex.text} → ${ex.label}`}
                    accent
                  />
                </div>
              );
            })}

            <PromptPart
              color="#FAC775"
              label="user"
              body={`Review: ${review}`}
            />
          </div>

          <div className="flex items-center justify-between border border-rule bg-paper/40 px-3 py-2 font-mono text-xs">
            <span className="text-muted">Prompt tokens</span>
            <span className="tabular-nums">
              {mode === 'zero' ? '29' : '214'}
            </span>
          </div>
          <div className="flex items-center justify-between border border-rule bg-paper/40 px-3 py-2 font-mono text-xs">
            <span className="text-muted">Extra cost</span>
            {mode === 'zero' ? (
              <span className="text-muted">—</span>
            ) : (
              <span style={{ color: '#FAC775' }}>+185 tok</span>
            )}
          </div>
        </div>

        {/* RIGHT — What the model sees differently */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            What the model sees differently
          </div>

          {mode === 'zero' ? (
            <div className="space-y-2 border border-rule bg-paper p-4">
              <div className="font-serif text-base font-semibold">
                Zero-shot
              </div>
              <p className="text-sm leading-relaxed text-foreground/85">
                The model relies entirely on what it learned during training.
                No examples provided — it must guess what Positive means to
                you.
              </p>
              <p className="text-xs italic text-muted">
                Works well for clear-cut cases. May struggle with sarcasm or
                ambiguity.
              </p>
            </div>
          ) : (
            <div className="space-y-3 border border-emerald-500 bg-emerald-500/5 p-4">
              <div className="font-serif text-base font-semibold text-emerald-400">
                Few-shot
              </div>
              <p className="text-sm leading-relaxed text-foreground/85">
                You show 3 examples of input → label pairs. The model now
                knows exactly what pattern you expect.
              </p>
              <p className="text-xs italic text-muted">
                More consistent and accurate. Costs ~80–120 extra tokens per
                call.
              </p>
              <TradeoffBar
                label="Accuracy"
                pct={92}
                tag="+12%"
                color="#22c55e"
              />
              <TradeoffBar
                label="Token cost"
                pct={75}
                tag="+3×"
                color="#FAC775"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border border-rule border-l-2 border-l-emerald-500 bg-paper/40 p-3 text-sm leading-relaxed text-foreground/85">
        <span aria-hidden className="mr-1.5">
          💡
        </span>
        The only difference between zero-shot and few-shot is the examples in
        the prompt. Same model, same weights — just more context.
      </div>
    </section>
  );
}

function PromptPart({
  color,
  label,
  body,
  accent = false,
}: {
  color: string;
  label: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className="border-l-2 px-3 py-2"
      style={{
        borderLeftColor: color,
        background: `${color}14`,
      }}
    >
      <div
        className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: accent ? '#34d399' : color }}
      >
        {label}
      </div>
      <p className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-foreground/90">
        {body}
      </p>
    </div>
  );
}

function TradeoffBar({
  label,
  pct,
  tag,
  color,
}: {
  label: string;
  pct: number;
  tag: string;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wide text-muted">
        <span>{label}</span>
        <span style={{ color }}>
          {pct}% <span className="opacity-70">({tag})</span>
        </span>
      </div>
      <div className="h-[6px] w-full bg-rule">
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            background: color,
            transition: 'width 400ms ease-out',
          }}
        />
      </div>
    </div>
  );
}

// ─── N13 — Chain of Thought ──────────────────────────────────────

type CoTResponse = {
  technique: 'direct' | 'cot';
  answer: string;
  steps: string[] | null;
  prompt_tokens: number;
  completion_tokens: number;
  provider: string;
  model: string;
};

const COT_PRESETS = [
  'A bookstore had 23 customers in the morning. In the afternoon, 17 more arrived but 9 left. By evening, twice as many came in as had left. How many customers were there at the end of the day?',
  'I have a 3-liter jug and a 5-liter jug. How can I measure exactly 4 liters of water?',
  'If five painters can paint five walls in five hours, how many walls can ten painters paint in ten hours?',
];

function NodeCoT() {
  const [provider, setProvider] = useState('openai');
  const [question, setQuestion] = useState(COT_PRESETS[0]);
  const [direct, setDirect] = useState<CoTResponse | null>(null);
  const [cot, setCot] = useState<CoTResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  const startStepReveal = (total: number) => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setRevealedSteps(0);
    let i = 0;
    const tick = () => {
      i += 1;
      setRevealedSteps(i);
      if (i < total) {
        revealTimerRef.current = setTimeout(tick, 380);
      } else {
        revealTimerRef.current = null;
      }
    };
    revealTimerRef.current = setTimeout(tick, 60);
  };

  const runOne = async (
    technique: 'direct' | 'cot',
  ): Promise<CoTResponse> => {
    const r = await fetch('http://localhost:8000/day03/cot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, technique, provider }),
    });
    if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
    return (await r.json()) as CoTResponse;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setDirect(null);
    setCot(null);
    setRevealedSteps(0);
    try {
      const [d, c] = await Promise.all([runOne('direct'), runOne('cot')]);
      setDirect(d);
      setCot(c);
      const stepCount = (c.steps ?? []).length;
      if (stepCount > 0) startStepReveal(stepCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Chain of Thought"
        hint='Same question, two prompts. "Direct" says answer quickly. "CoT" says think step by step first. For tricky reasoning, the second one is often more accurate.'
      />
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
        <div className="flex flex-wrap gap-2">
          {COT_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuestion(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              puzzle {i + 1}
            </button>
          ))}
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
          {loading ? 'Thinking…' : 'Compare both →'}
        </button>
      </form>
      {error && <ErrorBox message={error} />}

      {(direct || cot || loading) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DirectCard data={direct} loading={loading && !direct} />
          <CoTCard
            data={cot}
            loading={loading && !cot}
            revealedSteps={revealedSteps}
          />
        </div>
      )}

      <ExplainerBlock
        title="Why thinking out loud helps"
        body="An LLM generates the answer token by token, conditioning each token on every prior token. When the prompt says 'answer directly', the model commits to an answer in the very first tokens — often before it has worked through the problem. CoT forces it to write the intermediate steps first, so by the time the 'final answer' tokens come out, the reasoning is already in context. It is the model thinking on paper instead of in its head."
      />
    </div>
  );
}

function DirectCard({
  data,
  loading,
}: {
  data: CoTResponse | null;
  loading: boolean;
}) {
  return (
    <div className="border border-rule bg-paper p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Direct
        </div>
        <div className="text-xs text-muted">no reasoning shown</div>
      </div>
      {loading ? (
        <div className="font-mono text-xs uppercase tracking-wide text-muted">
          asking model…
        </div>
      ) : data ? (
        <div className="space-y-3">
          <div className="border-l-2 border-l-foreground/30 bg-paper/60 px-3 py-2 text-sm leading-relaxed">
            {data.answer || '(no answer)'}
          </div>
          <Footer>
            {data.provider} · {data.model} · {data.prompt_tokens}+
            {data.completion_tokens} tok
          </Footer>
        </div>
      ) : null}
    </div>
  );
}

function CoTCard({
  data,
  loading,
  revealedSteps,
}: {
  data: CoTResponse | null;
  loading: boolean;
  revealedSteps: number;
}) {
  const steps = data?.steps ?? [];
  return (
    <div className="border border-rule bg-paper p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Chain of Thought
        </div>
        <div className="text-xs text-muted">steps revealed in order</div>
      </div>
      {loading ? (
        <div className="font-mono text-xs uppercase tracking-wide text-muted">
          thinking…
        </div>
      ) : data ? (
        <div className="space-y-3">
          {steps.length > 0 && (
            <ol className="space-y-1.5">
              {steps.map((s, i) => {
                const visible = i < revealedSteps;
                return (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-relaxed"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible
                        ? 'translateX(0)'
                        : 'translateX(-6px)',
                      transition:
                        'opacity 350ms ease-out, transform 350ms ease-out',
                    }}
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border border-rule bg-paper font-mono text-[10px]">
                      {i + 1}
                    </span>
                    <span className="text-foreground/90">{s}</span>
                  </li>
                );
              })}
            </ol>
          )}
          <div
            className="border-l-2 border-l-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm leading-relaxed"
            style={{
              opacity: revealedSteps >= steps.length ? 1 : 0.3,
              transition: 'opacity 400ms ease-out',
            }}
          >
            <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wide text-emerald-400">
              Final answer
            </div>
            {data.answer || '(no answer)'}
          </div>
          <Footer>
            {data.provider} · {data.model} · {data.prompt_tokens}+
            {data.completion_tokens} tok
          </Footer>
        </div>
      ) : null}
    </div>
  );
}

// ─── N14 — Function calling ──────────────────────────────────────

type AgentArgs = Record<string, unknown>;
type AgentToolCall = { id: string; name: string; arguments: AgentArgs };
type AgentTimelineEntry =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content?: string; tool_calls?: AgentToolCall[] }
  | {
      role: 'tool';
      tool_call_id: string;
      name: string;
      result: Record<string, unknown>;
    };

type LoopThought = {
  iteration: number;
  type: 'model_thought';
  content: string;
};
type LoopCall = {
  iteration: number;
  type: 'tool_call';
  tool: string;
  input: Record<string, unknown>;
};
type LoopResult = {
  iteration: number;
  type: 'tool_result';
  tool: string;
  result: Record<string, unknown>;
  is_error: boolean;
  error?: string;
};
type LoopTraceItem = LoopThought | LoopCall | LoopResult;

type ToolAnatomy = {
  last_call: {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
  } | null;
  last_result: {
    type: 'tool_result';
    tool_use_id: string;
    content: string;
  } | null;
};

type AgentResponse = {
  question: string;
  answer: string;
  timeline: AgentTimelineEntry[];
  loop_trace?: LoopTraceItem[];
  tool_anatomy?: ToolAnatomy;
  iterations: number;
  tools_used: string[];
  prompt_tokens: number;
  completion_tokens: number;
  provider: string;
  model: string;
};

const AGENT_PRESETS = [
  'What is 24 * 7 plus the square root of 144, and what is the weather in Jakarta?',
  'Search for information about Anthropic, then tell me the weather in San Francisco.',
  'Calculate 2 to the power of 10, then multiply that by 3.',
];

function NodeFunctionCalling() {
  const [provider, setProvider] = useState('openai');
  const [question, setQuestion] = useState(AGENT_PRESETS[0]);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [showRawTrace, setShowRawTrace] = useState(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  const startReveal = (total: number) => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setRevealed(0);
    let i = 0;
    const tick = () => {
      i += 1;
      setRevealed(i);
      if (i < total) {
        revealTimerRef.current = setTimeout(tick, 320);
      } else {
        revealTimerRef.current = null;
      }
    };
    revealTimerRef.current = setTimeout(tick, 60);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setRevealed(0);
    setShowRawTrace(false);
    try {
      const r = await fetch('http://localhost:8000/day03/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      const data = (await r.json()) as AgentResponse;
      setResult(data);
      startReveal(data.timeline.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Function calling"
        hint="The model can request tools instead of guessing. Three tools are wired up: calculator, get_weather, web_search. Watch the round-trip from question → tool call → result → final answer."
      />
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
        <div className="flex flex-wrap gap-2">
          {AGENT_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuestion(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              prompt {i + 1}
            </button>
          ))}
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
          {loading ? 'Running agent…' : 'Run agent →'}
        </button>
      </form>
      {error && <ErrorBox message={error} />}

      {(loading || result) && <ToolPalette />}

      {result && (
        <div className="space-y-4">
          <AgentSummary result={result} />
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowRawTrace((v) => !v)}
              className="font-mono text-xs uppercase tracking-wide text-accent hover:underline"
            >
              {showRawTrace ? '▾ hide' : '▸ show'} raw message trace
              <span className="ml-1 text-muted">
                ({result.timeline.length} entries)
              </span>
            </button>
            {showRawTrace && (
              <ol className="space-y-2">
                {result.timeline.map((entry, i) => (
                  <TimelineRow
                    key={i}
                    entry={entry}
                    index={i}
                    visible={i < revealed}
                  />
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {result && result.loop_trace && result.loop_trace.length > 0 && (
        <AgentLoopVisualizer key={result.question} result={result} />
      )}

      {result && (
        <FadeIn key={`whathappened-${result.question}`}>
          <ExplainerBlock
            title="What just happened"
            body="The model didn't run any code itself. It got a list of tool schemas, decided which to call, and returned structured JSON for each call. The backend executed the tools, fed results back, and the model produced a final answer. That loop — model → tool call → tool result → model — is the foundation of every AI agent: it can do anything you give it a tool for."
          />
        </FadeIn>
      )}
    </div>
  );
}

function FadeIn({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
    >
      {children}
    </div>
  );
}

function ToolPalette() {
  const tools = [
    { name: 'calculator', desc: 'safe arithmetic eval', icon: '∑' },
    { name: 'get_weather', desc: 'mock city weather', icon: '☁' },
    { name: 'web_search', desc: 'mock search results', icon: '⌕' },
  ];
  return (
    <div className="border border-rule bg-paper/40 p-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        Available tools
      </div>
      <div className="flex flex-wrap gap-2">
        {tools.map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-2 border border-rule bg-paper px-2.5 py-1"
          >
            <span className="font-mono text-xs">{t.icon}</span>
            <span className="font-mono text-[11px]">{t.name}</span>
            <span className="text-[10px] text-muted">{t.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentSummary({ result }: { result: AgentResponse }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <Stat label="Iterations" value={result.iterations} />
      <Stat label="Tools used" value={result.tools_used.length || '—'} />
      <Stat label="Prompt tok" value={result.prompt_tokens} />
      <Stat label="Output tok" value={result.completion_tokens} />
    </div>
  );
}

function TimelineRow({
  entry,
  index,
  visible,
}: {
  entry: AgentTimelineEntry;
  index: number;
  visible: boolean;
}) {
  const style: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateX(0)' : 'translateX(-8px)',
    transition: 'opacity 320ms ease-out, transform 320ms ease-out',
  };
  if (entry.role === 'user') {
    return (
      <li className="border border-rule bg-paper p-3" style={style}>
        <RoleBadge label="User" color="muted" index={index} />
        <p className="mt-1.5 text-sm leading-relaxed">{entry.content}</p>
      </li>
    );
  }
  if (entry.role === 'assistant') {
    return (
      <li
        className="border border-rule border-l-2 border-l-accent bg-paper p-3"
        style={style}
      >
        <RoleBadge label="Assistant" color="accent" index={index} />
        {entry.content && (
          <p className="mt-1.5 text-sm leading-relaxed">{entry.content}</p>
        )}
        {entry.tool_calls && entry.tool_calls.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {entry.tool_calls.map((tc) => (
              <div
                key={tc.id}
                className="border border-rule bg-paper/40 px-2.5 py-1.5"
              >
                <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-muted">
                  <span className="text-accent">→ call</span>
                  <span className="font-semibold text-foreground/80">
                    {tc.name}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-foreground/80">
                  {JSON.stringify(tc.arguments, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </li>
    );
  }
  return (
    <li
      className="border border-rule border-l-2 border-l-emerald-500 bg-paper p-3"
      style={style}
    >
      <div className="flex items-center gap-2">
        <RoleBadge label="Tool" color="emerald" index={index} />
        <span className="font-mono text-[11px] text-emerald-400">
          {entry.name}
        </span>
      </div>
      <pre className="mt-1.5 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground/80">
        {JSON.stringify(entry.result, null, 2)}
      </pre>
    </li>
  );
}

function RoleBadge({
  label,
  color,
  index,
}: {
  label: string;
  color: 'muted' | 'accent' | 'emerald';
  index: number;
}) {
  const colorClass =
    color === 'accent'
      ? 'border-accent text-accent'
      : color === 'emerald'
        ? 'border-emerald-500 text-emerald-400'
        : 'border-rule text-muted';
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-muted">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span
        className={[
          'border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide',
          colorClass,
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="border border-rule bg-paper p-3">
      <div className="font-mono text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-1 font-serif text-2xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

const TOOL_COLOR: Record<string, string> = {
  calculator: '#B5D4F4',
  get_weather: '#9FE1CB',
  web_search: '#FAC775',
};
const DEFAULT_TOOL_COLOR = '#9CA3AF';

type RenderNode =
  | LoopTraceItem
  | { type: 'final_answer'; iteration: number; content: string };

function AgentLoopVisualizer({ result }: { result: AgentResponse }) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const arrowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const trace = result.loop_trace ?? [];
  const anatomy = result.tool_anatomy ?? { last_call: null, last_result: null };
  const items: RenderNode[] = [
    ...trace,
    {
      type: 'final_answer',
      iteration: result.iterations,
      content: result.answer,
    },
  ];

  useEffect(() => {
    nodeRefs.current = nodeRefs.current.slice(0, items.length);
    arrowRefs.current = arrowRefs.current.slice(0, Math.max(0, items.length - 1));

    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];

    const tSection = setTimeout(() => {
      const el = sectionRef.current;
      if (el) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }
    }, 30);
    timersRef.current.push(tSection);

    for (let i = 0; i < items.length; i++) {
      const tNode = setTimeout(
        () => {
          const el = nodeRefs.current[i];
          if (el) {
            el.style.opacity = '1';
            el.style.transform = 'translateX(0)';
          }
        },
        120 + i * 300,
      );
      timersRef.current.push(tNode);

      if (i < items.length - 1) {
        const tArrow = setTimeout(
          () => {
            const el = arrowRefs.current[i];
            if (el) el.style.opacity = '1';
          },
          120 + i * 300 + 150,
        );
        timersRef.current.push(tArrow);
      }
    }

    return () => {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
    };
  }, [result]);

  return (
    <div
      ref={sectionRef}
      className="space-y-4 border-t border-rule pt-6"
      style={{
        opacity: 0,
        transform: 'translateY(8px)',
        transition: 'opacity 500ms ease, transform 500ms ease',
      }}
    >
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Inside the agent loop
        </h3>
        <p className="text-xs text-muted">
          Reconstructed from the actual response — every node is what the model
          said or what your server returned.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* LEFT — animated loop trace */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Agent loop
          </div>
          <div className="space-y-0">
            {items.map((node, i) => (
              <div key={i}>
                <div
                  ref={(el) => {
                    nodeRefs.current[i] = el;
                  }}
                  style={{
                    opacity: 0,
                    transform: 'translateX(-8px)',
                    transition:
                      'opacity 320ms ease-out, transform 320ms ease-out',
                  }}
                >
                  <LoopNode node={node} />
                </div>
                {i < items.length - 1 && (
                  <div
                    ref={(el) => {
                      arrowRefs.current[i] = el;
                    }}
                    className="flex justify-center py-1 font-mono text-base text-foreground/40"
                    style={{
                      opacity: 0,
                      transition: 'opacity 280ms ease-out',
                    }}
                    aria-hidden
                  >
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — tool call anatomy */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Tool call anatomy
          </div>

          <AnatomyBox
            title="What model sends"
            payload={anatomy.last_call}
            valueColors={{
              type: '#9FE1CB',
              name: '#FAC775',
              id: '#FAC775',
              input: '#FAC775',
            }}
            fallback="No tool calls in this run."
          />

          <AnatomyBox
            title="What backend returns"
            payload={anatomy.last_result}
            valueColors={{
              type: '#9FE1CB',
              tool_use_id: '#FAC775',
              content: '#22c55e',
            }}
            fallback="No tool results in this run."
          />

          <div className="border border-rule border-l-2 border-l-emerald-500 bg-paper/40 p-3 text-sm leading-relaxed text-foreground/85">
            <div className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              💡 Key insight
            </div>
            The model never runs code itself. It outputs JSON, your server
            executes it, and feeds the result back.
          </div>
        </div>
      </div>
    </div>
  );
}

function LoopNode({ node }: { node: RenderNode }) {
  if (node.type === 'model_thought') {
    return (
      <div
        className="border border-l-2 bg-paper p-3"
        style={{ borderLeftColor: '#c4b5fd' }}
      >
        <div
          className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: '#c4b5fd' }}
        >
          <span>model thought</span>
          <span className="text-muted">· iter {node.iteration}</span>
        </div>
        <p className="text-sm italic leading-relaxed text-foreground/85">
          {node.content}
        </p>
      </div>
    );
  }

  if (node.type === 'tool_call') {
    const color = TOOL_COLOR[node.tool] ?? DEFAULT_TOOL_COLOR;
    return (
      <div
        className="border border-l-2 bg-paper p-3"
        style={{ borderLeftColor: color }}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
          <div className="flex items-center gap-2" style={{ color }}>
            <span>tool call</span>
            <span
              className="border px-1.5 py-0.5"
              style={{ borderColor: color, color }}
            >
              {node.tool}
            </span>
          </div>
          <span className="text-muted">iter {node.iteration}</span>
        </div>
        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground/80">
          {JSON.stringify(node.input, null, 2)}
        </pre>
      </div>
    );
  }

  if (node.type === 'tool_result') {
    const ok = !node.is_error;
    const accent = ok ? '#22c55e' : '#ef4444';
    const bg = ok ? 'bg-emerald-500/5' : 'bg-red-500/5';
    return (
      <div
        className={['border border-l-2 p-3', bg].join(' ')}
        style={{ borderLeftColor: accent }}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
          <div className="flex items-center gap-2" style={{ color: accent }}>
            <span>{ok ? 'tool result' : 'tool error'}</span>
            <span
              className="border px-1.5 py-0.5"
              style={{ borderColor: accent, color: accent }}
            >
              {node.tool}
            </span>
          </div>
          <span className="text-muted">iter {node.iteration}</span>
        </div>
        {ok ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground/85">
            {JSON.stringify(node.result, null, 2)}
          </pre>
        ) : (
          <p
            className="font-mono text-[12px] leading-relaxed"
            style={{ color: accent }}
          >
            {node.error || 'unknown error'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-emerald-500/10 p-3"
      style={{
        border: '1.5px solid #22c55e',
      }}
    >
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
        Final answer
      </div>
      <p className="text-sm font-semibold leading-relaxed text-foreground">
        {node.content || '(no answer)'}
      </p>
    </div>
  );
}

function AnatomyBox({
  title,
  payload,
  valueColors,
  fallback,
}: {
  title: string;
  payload: Record<string, unknown> | null;
  valueColors: Record<string, string>;
  fallback: string;
}) {
  return (
    <div className="border border-rule bg-paper p-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {title}
      </div>
      {payload ? (
        <div className="space-y-1">
          {Object.entries(payload).map(([k, v]) => (
            <div
              key={k}
              className="flex items-start gap-2 font-mono text-[11px] leading-relaxed"
            >
              <span style={{ color: '#9FE1CB' }}>{k}</span>
              <span className="text-foreground/50">:</span>
              <span
                className="flex-1 break-words"
                style={{ color: valueColors[k] ?? '#FAC775' }}
              >
                {typeof v === 'object' && v !== null
                  ? JSON.stringify(v)
                  : String(v)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-mono text-[11px] text-muted">{fallback}</p>
      )}
    </div>
  );
}

// ─── N15 — Prompt caching ────────────────────────────────────────

type CacheRun = {
  index: number;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens: number;
  answer: string;
};
type CacheResponse = {
  runs: CacheRun[];
  cache_supported: boolean;
  note: string;
  prefix_chars: number;
  prefix_tokens_estimate: number;
  provider: string;
  model: string;
};

const CACHE_PRESETS = [
  'In one sentence, summarize what the knowledge base says about RAG.',
  'Per the knowledge base, what threshold triggers OpenAI prompt caching?',
  'According to section 5, what is an agent?',
];

function NodeCaching() {
  const [provider, setProvider] = useState('openai');
  const [prompt, setPrompt] = useState(CACHE_PRESETS[0]);
  const [runs, setRuns] = useState(2);
  const [result, setResult] = useState<CacheResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [showRawResults, setShowRawResults] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowRawResults(false);
    try {
      const r = await fetch('http://localhost:8000/day03/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider, runs }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as CacheResponse);
      setRunId((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const maxLatency = result
    ? Math.max(...result.runs.map((r) => r.latency_ms))
    : 0;
  const speedup =
    result && result.runs.length >= 2 && result.runs[result.runs.length - 1].latency_ms > 0
      ? result.runs[0].latency_ms / result.runs[result.runs.length - 1].latency_ms
      : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Prompt caching"
        hint="The same long system prompt is sent N times. Providers that support caching reuse computation on the repeated prefix — second-run latency drops and cached_tokens shows up in the usage payload."
      />
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
        <div className="flex flex-wrap gap-2">
          {CACHE_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              prompt {i + 1}
            </button>
          ))}
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
            disabled={loading}
            className="rounded-none border border-rule bg-paper px-2.5 py-1 font-mono text-xs uppercase tracking-wide focus:border-accent focus:outline-none"
          >
            {[2, 3, 4, 5].map((n) => (
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
            {loading ? 'Running…' : 'Run cache demo →'}
          </button>
        </div>
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-4">
          <div className="border border-rule bg-paper p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                Cache prefix
              </div>
              <div className="font-mono text-xs text-foreground/70">
                ~{result.prefix_tokens_estimate} tokens · {result.prefix_chars}{' '}
                chars
              </div>
            </div>
            <p className="mt-1 text-xs text-muted">
              The same long system message is sent on every run. Identical
              prefix is what lets the cache kick in.
            </p>
          </div>

          {speedup > 1 && (
            <div className="border border-rule border-l-2 border-l-emerald-500 bg-emerald-500/10 px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-emerald-400">
                Speed-up
              </span>{' '}
              <span className="font-serif text-2xl font-semibold tabular-nums text-emerald-400">
                {speedup.toFixed(2)}×
              </span>
              <span className="ml-2 text-xs text-muted">
                first run vs last run
              </span>
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowRawResults((v) => !v)}
              className="font-mono text-xs uppercase tracking-wide text-accent hover:underline"
            >
              {showRawResults ? '▾ hide' : '▸ show'} raw results
              <span className="ml-1 text-muted">
                ({result.runs.length} runs · full answer text)
              </span>
            </button>
            {showRawResults && (
              <ol className="space-y-2">
                {result.runs.map((r) => (
                  <CacheRunRow
                    key={r.index}
                    run={r}
                    maxLatency={maxLatency}
                    cacheSupported={result.cache_supported}
                  />
                ))}
              </ol>
            )}
          </div>

          <div className="border border-rule bg-paper/40 px-3 py-2 text-xs text-muted">
            {result.note}
          </div>

          <Footer>
            {result.provider} · {result.model} · {result.runs.length} runs
          </Footer>
        </div>
      )}

      {result && result.runs.length > 0 && (
        <CacheVisualizer key={runId} result={result} />
      )}

      <ExplainerBlock
        title="Why caching matters"
        body="The slow part of inference is prefill — the model running attention over every input token before it generates the first output token. If you re-send the same prefix on the next call, the provider can keep the prefill state and skip straight to your new tokens. That cuts latency and (on OpenAI / DeepSeek) bills cached tokens at a discount. To benefit, put your stable content (system prompt, examples, retrieved chunks) at the start and your variable content (the user's actual question) at the end."
      />
    </div>
  );
}

function CacheRunRow({
  run,
  maxLatency,
  cacheSupported,
}: {
  run: CacheRun;
  maxLatency: number;
  cacheSupported: boolean;
}) {
  const widthPct = maxLatency > 0 ? (run.latency_ms / maxLatency) * 100 : 0;
  const cachedPct =
    run.prompt_tokens > 0
      ? (run.cached_tokens / run.prompt_tokens) * 100
      : 0;
  return (
    <li className="border border-rule bg-paper p-3">
      <div className="flex items-center justify-between gap-3 font-mono text-xs">
        <span className="text-muted">
          Run {String(run.index).padStart(2, '0')}
        </span>
        <div className="flex gap-4">
          <span>
            {run.latency_ms}{' '}
            <span className="text-muted">ms</span>
          </span>
          <span className="text-muted">
            {run.prompt_tokens}+{run.completion_tokens} tok
          </span>
          {cacheSupported && (
            <span
              className={
                run.cached_tokens > 0
                  ? 'text-emerald-400'
                  : 'text-muted'
              }
            >
              {run.cached_tokens} cached
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 h-[6px] w-full bg-rule">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${Math.max(2, widthPct)}%` }}
        />
      </div>
      {cacheSupported && run.prompt_tokens > 0 && (
        <div className="mt-1.5">
          <div className="mb-0.5 flex items-baseline justify-between font-mono text-[9px] uppercase tracking-wide text-muted">
            <span>Prompt tokens · cached / total</span>
            <span>{cachedPct.toFixed(0)}%</span>
          </div>
          <div className="flex h-[4px] w-full overflow-hidden bg-rule">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${cachedPct}%` }}
            />
          </div>
        </div>
      )}
      {run.answer && (
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
          {run.answer}
        </p>
      )}
    </li>
  );
}

function CacheVisualizer({ result }: { result: CacheResponse }) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const runRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cachedBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const newBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const outputBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const speedupRef = useRef<HTMLDivElement | null>(null);
  const insightRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const runs = result.runs;
  const run1 = runs[0];
  const cellCount = Math.min(run1 ? run1.prompt_tokens : 0, 80);
  const lastRun = runs[runs.length - 1];
  const speedup =
    runs.length >= 2 && lastRun && lastRun.latency_ms > 0 && run1
      ? run1.latency_ms / lastRun.latency_ms
      : 0;

  useEffect(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];

    if (!run1) return;

    const sched = (delay: number, fn: () => void) => {
      const id = setTimeout(fn, delay);
      timersRef.current.push(id);
    };

    const segWidths = (run: CacheRun) => {
      const total = run.prompt_tokens + run.completion_tokens;
      if (total <= 0) return { c: 0, n: 0, o: 0 };
      const newPrefix = Math.max(0, run.prompt_tokens - run.cached_tokens);
      return {
        c: (run.cached_tokens / total) * 100,
        n: (newPrefix / total) * 100,
        o: (run.completion_tokens / total) * 100,
      };
    };

    sched(30, () => {
      const el = sectionRef.current;
      if (el) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }
    });

    let t = 300;

    sched(t, () => {
      const el = runRefs.current[0];
      if (el) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }
    });

    t += 300;
    sched(t, () => {
      const w = segWidths(run1);
      const c = cachedBarRefs.current[0];
      const n = newBarRefs.current[0];
      const o = outputBarRefs.current[0];
      if (c) c.style.width = `${w.c}%`;
      if (n) n.style.width = `${w.n}%`;
      if (o) o.style.width = `${w.o}%`;
    });

    t += 700;
    for (let i = 0; i < cellCount; i++) {
      sched(t + i * 28, () => {
        const el = pillRefs.current[i];
        if (el) {
          el.style.opacity = '1';
          el.style.background = '#FAC775';
        }
      });
    }
    t += cellCount * 28 + 500;

    if (runs.length >= 2) {
      const run2 = runs[1];

      sched(t, () => {
        const el = runRefs.current[1];
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
      });

      t += 200;
      sched(t, () => {
        const w = segWidths(run2);
        const c = cachedBarRefs.current[1];
        const n = newBarRefs.current[1];
        const o = outputBarRefs.current[1];
        if (c) c.style.width = `${w.c}%`;
        if (n) n.style.width = `${w.n}%`;
        if (o) o.style.width = `${w.o}%`;
      });

      t += 500;
      const cachedDisplay = Math.min(run2.cached_tokens, cellCount);
      for (let i = 0; i < cachedDisplay; i++) {
        sched(t + i * 22, () => {
          const el = pillRefs.current[i];
          if (el) {
            el.style.background = '#1D9E75';
          }
        });
      }
      t += cachedDisplay * 22 + 300;
    }

    for (let i = 2; i < runs.length; i++) {
      const runI = runs[i];
      sched(t, () => {
        const el = runRefs.current[i];
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
      });
      t += 200;
      sched(t, () => {
        const w = segWidths(runI);
        const c = cachedBarRefs.current[i];
        const n = newBarRefs.current[i];
        const o = outputBarRefs.current[i];
        if (c) c.style.width = `${w.c}%`;
        if (n) n.style.width = `${w.n}%`;
        if (o) o.style.width = `${w.o}%`;
      });
      t += 500;
    }

    if (speedup > 1) {
      sched(t, () => {
        const el = speedupRef.current;
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
      });
      t += 400;
    }

    sched(t, () => {
      const el = insightRef.current;
      if (el) el.style.opacity = '1';
    });

    return () => {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
    };
  }, [result, run1, runs, cellCount, speedup]);

  if (!run1) return null;

  return (
    <div
      ref={sectionRef}
      className="space-y-4 border-t border-rule pt-6"
      style={{
        opacity: 0,
        transform: 'translateY(8px)',
        transition: 'opacity 500ms ease, transform 500ms ease',
      }}
    >
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          How prompt caching changes the work
        </h3>
        <p className="text-xs text-muted">
          Every value below comes from the run you just made — left shows what
          changed, right shows why.
        </p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: 20 }}
      >
        {/* LEFT — Token processing */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Token processing
          </div>
          {runs.map((run, i) => {
            const isFaster = i > 0 && run.latency_ms < run1.latency_ms;
            const newPrefix = Math.max(
              0,
              run.prompt_tokens - run.cached_tokens,
            );
            return (
              <div
                key={run.index}
                ref={(el) => {
                  runRefs.current[i] = el;
                }}
                className="border border-rule bg-paper p-3"
                style={{
                  opacity: 0,
                  transform: 'translateY(8px)',
                  transition:
                    'opacity 300ms ease-out, transform 300ms ease-out',
                }}
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <div className="font-mono text-[11px] uppercase tracking-wide">
                    Run {String(run.index).padStart(2, '0')}
                    <span className="text-muted">
                      {' '}— {i === 0 ? 'cold start' : 'cache hit ✓'}
                    </span>
                  </div>
                  <div
                    className="font-mono text-xs tabular-nums"
                    style={{ color: isFaster ? '#22c55e' : '#9CA3AF' }}
                  >
                    {run.latency_ms} ms
                  </div>
                </div>

                <div
                  className="flex w-full overflow-hidden bg-rule"
                  style={{ height: 28 }}
                >
                  <div
                    ref={(el) => {
                      cachedBarRefs.current[i] = el;
                    }}
                    style={{
                      width: '0%',
                      background: '#1D9E75',
                      transition: 'width 600ms ease-out',
                    }}
                  />
                  <div
                    ref={(el) => {
                      newBarRefs.current[i] = el;
                    }}
                    style={{
                      width: '0%',
                      background: '#FAC775',
                      transition: 'width 600ms ease-out',
                    }}
                  />
                  <div
                    ref={(el) => {
                      outputBarRefs.current[i] = el;
                    }}
                    style={{
                      width: '0%',
                      background: 'rgba(181,212,244,0.5)',
                      transition: 'width 600ms ease-out',
                    }}
                  />
                </div>

                <div className="mt-2 font-mono text-[11px]">
                  <span
                    style={{
                      color: run.cached_tokens > 0 ? '#1D9E75' : '#9CA3AF',
                    }}
                  >
                    {run.cached_tokens} cached
                  </span>
                  <span className="text-muted"> · </span>
                  <span style={{ color: '#FAC775' }}>{newPrefix} new</span>
                  <span className="text-muted"> · </span>
                  <span style={{ color: '#B5D4F4' }}>
                    {run.completion_tokens} output
                  </span>
                </div>

                <div className="mt-2 text-xs text-muted">
                  {i === 0
                    ? '⚠️ Every token processed from scratch. Expensive prefill.'
                    : '✅ Prefix skipped — model jumps straight to new tokens.'}
                </div>
              </div>
            );
          })}

          {speedup > 1 && (
            <div
              ref={speedupRef}
              className="border border-rule border-l-2 border-l-emerald-500 bg-emerald-500/10 px-3 py-2"
              style={{
                opacity: 0,
                transform: 'translateY(4px)',
                transition:
                  'opacity 400ms ease-out, transform 400ms ease-out',
              }}
            >
              <span className="font-mono text-[10px] uppercase tracking-wide text-emerald-400">
                Speed-up
              </span>{' '}
              <span className="font-serif text-2xl font-semibold tabular-nums text-emerald-400">
                {speedup.toFixed(2)}x
              </span>
              <span className="ml-2 text-xs text-muted">
                faster (run 01 → last run)
              </span>
            </div>
          )}

          <CacheLegend />
        </div>

        {/* RIGHT — How caching works */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            How caching works
          </div>

          <div className="border border-rule bg-paper p-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted">
              Token flow · first {cellCount} prompt tokens
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
                gap: 2,
              }}
            >
              {Array.from({ length: cellCount }, (_, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    pillRefs.current[i] = el;
                  }}
                  style={{
                    height: 10,
                    width: '100%',
                    opacity: 0,
                    background: 'rgba(255,255,255,0.05)',
                    transition:
                      'opacity 200ms ease-out, background 260ms ease-out',
                  }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Each cell = one token. Green = cached on Run 02.
            </p>
          </div>

          <div className="border border-rule bg-paper p-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              What the provider saves
            </div>
            <p className="text-xs leading-relaxed text-foreground/85">
              On run 01 the provider runs attention over every prompt token —
              the expensive prefill step. On run 02 the cached prefix is
              already pre-computed, so the model starts generating almost
              immediately. The work skipped is identical between runs because
              the prefix is identical.
            </p>
          </div>

          <div className="space-y-1.5 border border-rule bg-paper p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Cost impact · per 1M input tokens
            </div>
            <div>
              <div className="mb-0.5 flex items-baseline justify-between font-mono text-[11px]">
                <span className="text-muted">Uncached</span>
                <span style={{ color: '#FAC775' }}>$0.150</span>
              </div>
              <div className="h-[8px] w-full bg-rule">
                <div
                  className="h-full"
                  style={{ width: '100%', background: '#FAC775' }}
                />
              </div>
            </div>
            <div>
              <div className="mb-0.5 flex items-baseline justify-between font-mono text-[11px]">
                <span className="text-muted">Cached (−75%)</span>
                <span style={{ color: '#1D9E75' }}>$0.0375</span>
              </div>
              <div className="h-[8px] w-full bg-rule">
                <div
                  className="h-full"
                  style={{ width: '37%', background: '#1D9E75' }}
                />
              </div>
            </div>
          </div>

          <div
            ref={insightRef}
            className="border-l-2 border-rule bg-paper/40 py-2 pl-3 pr-2 leading-relaxed text-foreground/85"
            style={{
              opacity: 0,
              transition: 'opacity 400ms ease-out',
              fontSize: 12,
            }}
          >
            <span aria-hidden className="mr-1">
              💡
            </span>
            Put your stable content (system prompt, examples, retrieved
            chunks) at the START of the prompt. Put the variable part (user
            question) at the END. Caching only works on the shared prefix.
          </div>
        </div>
      </div>
    </div>
  );
}

function CacheLegend() {
  const items: { color: string; label: string }[] = [
    { color: '#1D9E75', label: 'cached' },
    { color: '#FAC775', label: 'new prefix' },
    { color: 'rgba(181,212,244,0.5)', label: 'output' },
    { color: '#FAC775', label: 'uncached prefix' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[10px] uppercase tracking-wide text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block"
            style={{
              width: 12,
              height: 8,
              background: it.color,
            }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
