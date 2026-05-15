'use client';

import { useEffect, useState } from 'react';
import { AnswerCard } from '../components/Markdown';
import ModelSwitcher from '../components/ModelSwitcher';
import { useNodeProgress } from '../components/useNodeProgress';
import {
  type FlowDiagramData,
  type StreamMeta,
  useStreamingAsk,
} from '../components/useStreamingAsk';

type Snapshot = {
  thinking: string;
  answer: string;
  meta: StreamMeta | null;
  diagram: FlowDiagramData | null;
  error: string | null;
};

type Node = {
  id: string;
  label: string;
  title: string;
  prompt: string;
  hint: string;
};

const NODES: Node[] = [
  {
    id: 'N1',
    label: 'AI engineer',
    title: 'What is an AI engineer?',
    prompt: 'What is an AI engineer? Explain the role in 4 short paragraphs.',
    hint: 'High-level definition, scope, and what makes the role distinct.',
  },
  {
    id: 'N2',
    label: 'Roles & responsibilities',
    title: 'Roles and responsibilities',
    prompt:
      'List the typical day-to-day roles and responsibilities of an AI engineer. Use bullet-style prose (no markdown).',
    hint: 'What does an AI engineer actually do at work, week to week?',
  },
  {
    id: 'N3',
    label: 'Learning path',
    title: 'AI engineer learning path',
    prompt:
      'Outline a practical, step-by-step learning path to become an AI engineer in 6 months. Cover prerequisites, then milestones month-by-month.',
    hint: 'A concrete roadmap from zero to employable.',
  },
  {
    id: 'N4',
    label: 'AI vs ML engineer',
    title: 'AI engineer vs ML engineer',
    prompt:
      'Compare an AI engineer and a Machine Learning engineer. Cover: focus, daily tools, typical projects, and where the roles overlap. Keep it concrete.',
    hint: 'Two adjacent jobs, frequently confused. Surface the differences.',
  },
  {
    id: 'N5',
    label: 'Terminology',
    title: 'Common terminology',
    prompt: '', // Filled dynamically from the term input
    hint: 'Define the term plainly. Then show how it relates to AI / AGI / LLMs / inference / tokens.',
  },
];

export default function Day01Page() {
  const [activeId, setActiveId] = useState('N1');
  const active = NODES.find((n) => n.id === activeId)!;

  const [provider, setProvider] = useState('openai');
  const [question, setQuestion] = useState(NODES[0].prompt);
  const [term, setTerm] = useState('inference');
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const stream = useStreamingAsk();

  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const anyStreaming = stream.status === 'streaming' && streamingId !== null;
  const isStreamingActive = anyStreaming && streamingId === activeId;

  useEffect(() => {
    if (!streamingId) return;
    if (stream.status === 'streaming' || stream.status === 'done' || stream.status === 'error') {
      setSnapshots((prev) => ({
        ...prev,
        [streamingId]: {
          thinking: stream.thinking,
          answer: stream.answer,
          meta: stream.meta,
          diagram: stream.diagram,
          error: stream.error,
        },
      }));
    }
    if (stream.status === 'done' || stream.status === 'error') {
      setStreamingId(null);
    }
  }, [stream.status, stream.thinking, stream.answer, stream.meta, stream.diagram, stream.error, streamingId]);

  const snap: Snapshot =
    streamingId === activeId
      ? {
          thinking: stream.thinking,
          answer: stream.answer,
          meta: stream.meta,
          diagram: stream.diagram,
          error: stream.error,
        }
      : snapshots[activeId] ?? { thinking: '', answer: '', meta: null, diagram: null, error: null };

  const hasResult = snap.answer.length > 0 || snap.meta !== null;

  const progress = useNodeProgress(1);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  const selectNode = (id: string) => {
    setActiveId(id);
    setThinkingOpen(false);
    const next = NODES.find((n) => n.id === id)!;
    if (id === 'N5') {
      setQuestion(`Define "${term}" in the context of AI engineering.`);
    } else {
      setQuestion(next.prompt);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuestion =
      activeId === 'N5'
        ? `Define "${term}" in the context of AI engineering. Explain how it relates to AI, AGI, LLMs, inference, and tokens.`
        : question;
    if (!finalQuestion.trim()) return;
    setThinkingOpen(false);
    setSnapshots((prev) => {
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
    setStreamingId(activeId);
    stream.start({
      url: 'http://localhost:8000/day01/ask/stream',
      body: { question: finalQuestion, provider },
    });
  };

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 01 Â· Intro + LLM Basics
          </p>
          {progress.dayProgress && (
            <span className="border border-rule bg-paper px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide">
              <span className="text-accent">{progress.dayProgress.done}</span>
              <span className="text-muted"> / {progress.dayProgress.total} nodes</span>
            </span>
          )}
        </div>
        <h1 className="text-4xl font-semibold leading-tight">
          Five nodes to <span className="text-accent">begin</span>.
        </h1>
        <p className="text-sm text-muted">
          Pick a node, pick a provider, ask. Each tab is one of N1–N5.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {NODES.map((n) => {
          const isActive = n.id === activeId;
          const done = isDone(n.id);
          return (
            <button
              key={n.id}
              onClick={() => selectNode(n.id)}
              className={[
                'flex items-center gap-1.5 border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition',
                isActive
                  ? 'border-accent bg-accent text-white'
                  : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex h-3.5 w-3.5 items-center justify-center border text-[9px] leading-none',
                  done
                    ? isActive
                      ? 'border-white bg-white text-accent'
                      : 'border-accent bg-accent text-white'
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
              {streamingId === n.id && (
                <span
                  className={[
                    'ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full',
                    isActive ? 'bg-white' : 'bg-accent',
                  ].join(' ')}
                  aria-label="streaming"
                />
              )}
            </button>
          );
        })}
      </nav>

      <section className="space-y-2 border-l-2 border-accent pl-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-2xl font-semibold">{active.title}</h2>
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
            {activeIsDone ? 'completed' : 'mark complete'}
          </button>
        </div>
        <p className="text-sm text-muted">{active.hint}</p>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
              <span className="font-mono text-xs uppercase tracking-wide text-muted">
                Provider
              </span>
              <ModelSwitcher
                selected={provider}
                onChange={setProvider}
                disabled={anyStreaming}
              />
            </div>

            {activeId === 'N5' ? (
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-wide text-muted">
                  Term to define
                </label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. inference, AGI, embedding"
                  disabled={anyStreaming}
                  className="w-full border-b border-foreground bg-transparent py-2 text-lg outline-none placeholder:text-muted/60 focus:border-accent"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-wide text-muted">
                  Question (editable)
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={anyStreaming}
                  rows={3}
                  className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={
                anyStreaming ||
                (activeId === 'N5' ? !term.trim() : !question.trim())
              }
              className="border border-foreground bg-foreground px-5 py-2 font-mono text-xs uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
            >
              {isStreamingActive
                ? 'Asking…'
                : anyStreaming
                  ? `Streaming on ${streamingId}…`
                  : 'Ask →'}
            </button>
          </form>

          {snap.error && (
            <div className="border-l-2 border-accent bg-paper px-4 py-3 text-sm text-accent">
              {snap.error}
            </div>
          )}

          {isStreamingActive && !snap.answer && !snap.thinking && (
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              thinking…
            </div>
          )}

          {(hasResult || isStreamingActive) && (
            <section className="space-y-4">
              {snap.thinking && (
                <div className="border border-rule bg-paper">
                  <button
                    type="button"
                    onClick={() => setThinkingOpen((o) => !o)}
                    className="flex w-full items-center justify-between px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-muted hover:text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{thinkingOpen ? '▾' : '▸'}</span>
                      thinking
                      {isStreamingActive && (
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                      )}
                    </span>
                    <span className="text-[10px] opacity-60">
                      {snap.thinking.length} chars
                    </span>
                  </button>
                  {thinkingOpen && (
                    <p className="border-t border-rule px-4 py-3 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">
                      {snap.thinking}
                    </p>
                  )}
                </div>
              )}

              <AnswerCard
                text={snap.answer}
                streaming={isStreamingActive}
                placeholder={isStreamingActive ? 'streaming…' : ''}
                diagram={snap.diagram}
              />

              {snap.meta && (
                <p className="font-mono text-xs uppercase tracking-wide text-muted">
                  {snap.meta.provider} Â· {snap.meta.model} Â·{' '}
                  <span className="text-foreground/70">
                    {snap.meta.promptTokens}
                  </span>{' '}
                  prompt +{' '}
                  <span className="text-foreground/70">
                    {snap.meta.completionTokens}
                  </span>{' '}
                  completion
                </p>
              )}
            </section>
          )}
        </div>

        <div>
          {activeId === 'N1' && <VisualN1 />}
          {activeId === 'N2' && <VisualN2 />}
          {activeId === 'N3' && <VisualN3 />}
          {activeId === 'N4' && <VisualN4 />}
          {activeId === 'N5' && <VisualN5 />}
        </div>
      </div>
    </article>
  );
}

const VIZ_COLORS = {
  green: '#1D9E75',
  blue: '#378ADD',
  violet: '#7F77DD',
  teal: '#14B8A6',
  amber: '#FAC775',
  coral: '#F5C4B3',
} as const;

function VisualSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function TopBorderCard({
  color,
  label,
  children,
}: {
  color: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="border border-rule bg-paper p-3"
      style={{
        borderTop: `2px solid ${color}`,
        borderRadius: 8,
      }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {label}
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function VisualN1() {
  const roles: {
    color: string;
    label: string;
    title: string;
    body: string;
    tools: string;
  }[] = [
    {
      color: VIZ_COLORS.green,
      label: 'AI Engineer',
      title: 'Builds apps with pre-trained models',
      body: 'Focuses on integration, deployment, and UX.',
      tools: 'Tools: APIs, LangChain, vector DBs, FastAPI',
    },
    {
      color: VIZ_COLORS.blue,
      label: 'ML Engineer',
      title: 'Trains and fine-tunes models',
      body: 'Focuses on performance and data pipelines.',
      tools: 'Tools: PyTorch, TensorFlow, CUDA, datasets',
    },
    {
      color: VIZ_COLORS.violet,
      label: 'AI Researcher',
      title: 'Designs new algorithms',
      body: 'Publishes papers and works in research labs.',
      tools: 'Tools: Math, experiments, compute clusters',
    },
  ];
  return (
    <VisualSection
      title="Three flavors of an AI person"
      hint="Same field, different jobs. You are the green one."
    >
      <div className="space-y-2">
        {roles.map((r) => (
          <div
            key={r.label}
            className="flex items-stretch border border-rule bg-paper"
            style={{
              borderLeft: `2px solid ${r.color}`,
              borderRadius: 8,
              padding: '10px 14px',
            }}
          >
            <div className="flex-1 space-y-0.5">
              <div
                className="font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: r.color }}
              >
                {r.label}
              </div>
              <p className="text-[13px] font-semibold leading-snug text-foreground/90">
                {r.title}
              </p>
              <p className="text-[12px] leading-snug text-foreground/75">
                {r.body}
              </p>
              <p className="text-[11px] text-muted">{r.tools}</p>
            </div>
          </div>
        ))}
      </div>
      <div
        className="bg-paper/40 p-3 text-sm leading-relaxed text-foreground/85"
        style={{
          borderLeft: `2px solid ${VIZ_COLORS.green}`,
          borderRadius: 8,
        }}
      >
        <span aria-hidden className="mr-1.5">
          💡
        </span>
        You are here → AI Engineer. You use what ML Engineers and Researchers
        build.
      </div>
    </VisualSection>
  );
}

function VisualN2() {
  const days = [
    {
      day: 'Monday',
      color: VIZ_COLORS.teal,
      task: 'Integrate OpenAI API into new feature',
      pill: 'Integrate',
    },
    {
      day: 'Tuesday',
      color: VIZ_COLORS.amber,
      task: 'Set up vector DB for semantic search',
      pill: 'Build',
    },
    {
      day: 'Wednesday',
      color: VIZ_COLORS.violet,
      task: 'Prompt engineering & evaluation',
      pill: 'Optimize',
    },
    {
      day: 'Thursday',
      color: VIZ_COLORS.coral,
      task: 'Deploy to EC2, monitor latency & costs',
      pill: 'Deploy',
    },
  ];
  return (
    <VisualSection
      title="A typical week"
      hint="What an AI engineer actually does, day by day."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {days.map((d) => (
          <div
            key={d.day}
            className="border border-rule bg-paper p-3"
            style={{
              borderLeft: `2px solid ${d.color}`,
              borderRadius: 8,
            }}
          >
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: d.color }}
            >
              {d.day}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">
              {d.task}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {days.map((d) => (
          <div
            key={d.pill}
            className="flex items-center justify-center px-2 py-1 font-mono text-[10px] uppercase tracking-wide"
            style={{
              border: `1px solid ${d.color}`,
              color: d.color,
              background: `${d.color}1F`,
              borderRadius: 999,
            }}
          >
            {d.pill}
          </div>
        ))}
      </div>
    </VisualSection>
  );
}

function VisualN3() {
  const months = [
    {
      n: 1,
      color: VIZ_COLORS.teal,
      title: 'Prerequisites',
      sub: 'Python, APIs, basic math',
    },
    {
      n: 2,
      color: VIZ_COLORS.amber,
      title: 'LLM basics',
      sub: 'Prompting, tokens, APIs',
    },
    {
      n: 3,
      color: VIZ_COLORS.violet,
      title: 'RAG & vectors',
      sub: 'Embeddings, pgvector',
    },
    {
      n: 4,
      color: VIZ_COLORS.coral,
      title: 'Agents & tools',
      sub: 'Function calling, loops',
    },
    {
      n: 5,
      color: VIZ_COLORS.blue,
      title: 'Deploy & scale',
      sub: 'AWS, Docker, PM2',
    },
    {
      n: 6,
      color: VIZ_COLORS.green,
      title: 'Portfolio',
      sub: 'Ship real projects',
    },
  ];
  const gradient = `linear-gradient(to right, ${VIZ_COLORS.teal}, ${VIZ_COLORS.amber}, ${VIZ_COLORS.violet}, ${VIZ_COLORS.coral}, ${VIZ_COLORS.blue}, ${VIZ_COLORS.green})`;
  return (
    <VisualSection
      title="6-month learning path"
      hint="A practical month-by-month plan from zero to portfolio."
    >
      <div className="grid grid-cols-3 gap-2">
        {months.map((m) => (
          <div
            key={m.n}
            className="border border-rule bg-paper p-2.5"
            style={{
              borderTop: `2px solid ${m.color}`,
              borderRadius: 8,
              minHeight: 80,
            }}
          >
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: m.color }}
            >
              Month {m.n}
            </div>
            <p className="mt-1 text-[12px] font-semibold leading-snug text-foreground/90">
              {m.title}
            </p>
            <p className="text-[11px] leading-snug text-muted">{m.sub}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div
          className="h-[8px] w-full overflow-hidden"
          style={{ background: gradient, borderRadius: 4 }}
        />
        <p className="text-[12px] text-muted">VAL covers months 2–4</p>
      </div>
    </VisualSection>
  );
}

function VisualN4() {
  const aiPoints = [
    'Uses pre-trained models',
    'Integrates APIs',
    'Ships products fast',
    'Prompt engineering',
    'System architecture',
  ];
  const mlPoints = [
    'Trains models from scratch',
    'Works with raw data',
    'Optimizes performance',
    'Runs experiments',
    'Designs architectures',
  ];
  const overlap = [
    'Python',
    'APIs',
    'Cloud deployment',
    'Data handling',
    'Evaluation',
    'Fine-tuning',
  ];
  return (
    <VisualSection
      title="Two roles, side by side"
      hint="Adjacent jobs, frequently confused. Here is the diff."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ComparisonCard
          color={VIZ_COLORS.green}
          label="AI Engineer"
          points={aiPoints}
        />
        <ComparisonCard
          color={VIZ_COLORS.blue}
          label="ML Engineer"
          points={mlPoints}
        />
      </div>
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Where they overlap
        </div>
        <div className="flex flex-wrap gap-1.5">
          {overlap.map((p) => (
            <span
              key={p}
              className="px-2.5 py-1 font-mono text-[11px]"
              style={{
                color: VIZ_COLORS.green,
                background: `${VIZ_COLORS.green}1F`,
                border: `1px solid ${VIZ_COLORS.green}`,
                borderRadius: 999,
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </VisualSection>
  );
}

function ComparisonCard({
  color,
  label,
  points,
}: {
  color: string;
  label: string;
  points: string[];
}) {
  return (
    <div
      className="border border-rule bg-paper p-3"
      style={{
        borderTop: `2px solid ${color}`,
        borderRadius: 8,
      }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {label}
      </div>
      <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-foreground/85">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span aria-hidden style={{ color }}>
              •
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type TermId = 'llm' | 'token' | 'inference' | 'embedding' | 'rag' | 'agi';

type TermDef = {
  id: TermId;
  label: string;
  short: string;
  analogy: string;
  example: string;
};

const TERMS: TermDef[] = [
  {
    id: 'llm',
    label: 'LLM',
    short: 'Large Language Model',
    analogy:
      'Like an extremely well-read person who has read almost the entire internet. They can answer questions, write, and reason — but they can’t learn new things after training ended.',
    example: 'GPT-4o, Claude, Gemini, Llama',
  },
  {
    id: 'token',
    label: 'Token',
    short: 'Unit of text',
    analogy:
      'Think of tokens like Lego bricks for text. "Hello world" = 2 tokens. The model reads and writes one token at a time.',
    example: '"embedding" = 1 token',
  },
  {
    id: 'inference',
    label: 'Inference',
    short: 'Running the model',
    analogy:
      'Like asking a chef to cook a dish. Training taught the chef the recipe. Inference is the actual cooking — each response costs time and energy.',
    example: 'every time you send a message, inference runs',
  },
  {
    id: 'embedding',
    label: 'Embedding',
    short: 'Text as numbers',
    analogy:
      'Like GPS coordinates but for meaning. "Cat" and "kitten" get similar coordinates. "Cat" and "rocket" get very different ones.',
    example: '[0.12, −0.87, 0.34, … ×1536]',
  },
  {
    id: 'rag',
    label: 'RAG',
    short: 'Retrieval-Augmented Generation',
    analogy:
      'Like an open-book exam. The model searches a database first, then writes its answer using what it found.',
    example: 'ChatGPT browsing before answering',
  },
  {
    id: 'agi',
    label: 'AGI',
    short: 'Artificial General Intelligence',
    analogy:
      'A hypothetical AI that can do anything a human can. We don’t have it yet. Current LLMs are narrow tools, not AGI.',
    example: 'still theoretical',
  },
];

function VisualN5() {
  const [activeTerm, setActiveTerm] = useState<TermId>('llm');
  const active = TERMS.find((t) => t.id === activeTerm) ?? TERMS[0];
  return (
    <VisualSection
      title="Click a term to expand"
      hint="Six words you will hear all the time. Each one in plain English."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TERMS.map((t) => {
          const isActive = t.id === activeTerm;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTerm(t.id)}
              className="border bg-paper p-3 text-left transition hover:border-foreground"
              style={{
                borderColor: isActive ? VIZ_COLORS.green : 'var(--rule)',
                background: isActive ? `${VIZ_COLORS.green}14` : undefined,
                borderRadius: 8,
              }}
            >
              <div
                className="font-mono text-[12px] font-semibold"
                style={{ color: isActive ? VIZ_COLORS.green : undefined }}
              >
                {t.label}
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">
                {t.short}
              </p>
            </button>
          );
        })}
      </div>
      <div
        className="border border-rule bg-paper p-4"
        style={{
          borderLeft: `2px solid ${VIZ_COLORS.green}`,
          borderRadius: 8,
        }}
      >
        <div className="font-serif text-lg font-semibold">{active.label}</div>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {active.short}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-foreground/85">
          {active.analogy}
        </p>
        <p className="mt-2 text-[12px] text-muted">
          <span className="font-mono uppercase tracking-wide">Example:</span>{' '}
          {active.example}
        </p>
      </div>
    </VisualSection>
  );
}
