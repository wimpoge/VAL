'use client';

import { useState } from 'react';
import ModelSwitcher from '../../components/ModelSwitcher';
import { Markdown } from '../../components/Markdown';
import { useNodeProgress } from '../../components/useNodeProgress';
import DayPager from '../../components/DayPager';

const NODES = [
  { id: 'N76', label: 'LCEL', title: 'LangChain core (LCEL)' },
  { id: 'N77', label: 'Agents', title: 'LangChain Agents + Picker' },
  { id: 'N78', label: 'LlamaIndex', title: 'LlamaIndex' },
  { id: 'N79', label: 'LangGraph', title: 'LangGraph' },
  { id: 'N80', label: 'CrewAI', title: 'CrewAI' },
];

const VIZ = {
  green: '#1D9E75',
  blue: '#378ADD',
  violet: '#7F77DD',
  amber: '#FAC775',
  coral: '#F5C4B3',
  red: '#E24B4A',
  grey: '#9CA3AF',
  teal: '#5BB7B0',
} as const;

const API = 'http://localhost:8000';

export default function Day16Page() {
  const [activeId, setActiveId] = useState('N76');
  const [provider, setProvider] = useState('openai');
  const progress = useNodeProgress(16);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 16 · LLM Frameworks
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
          From simple chains to{' '}
          <span className="text-accent">multi-agent crews</span>.
        </h1>
        <p className="text-sm text-muted">
          LangChain LCEL, LangChain Agents, LlamaIndex, LangGraph, CrewAI
          &mdash; when each one earns its weight, and when raw API calls
          still win. N76&ndash;N80.
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

      <div className={activeId === 'N76' ? undefined : 'hidden'}>
        <NodeLCEL provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N77' ? undefined : 'hidden'}>
        <NodeAgents provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N78' ? undefined : 'hidden'}>
        <NodeLlamaIndex provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N79' ? undefined : 'hidden'}>
        <NodeLangGraph provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N80' ? undefined : 'hidden'}>
        <NodeCrewAI provider={provider} setProvider={setProvider} />
      </div>

      <FrameworkCompareSection />

      <DayPager day={16} advanced />
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
      const r = await fetch(`${API}/day16/ask`, {
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

// ─── N76 — LangChain LCEL + Pipe diagram ─────────────────────────

function NodeLCEL({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="LangChain core (LCEL)"
        hint="The declarative pipe syntax that gave LangChain a second life. Compose runnables with the | operator the same way you'd compose Unix commands: PromptTemplate | ChatOpenAI | StrOutputParser. Streaming, batching, async, and tracing come along for free."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="The | operator"
          body="Every LCEL primitive implements Runnable. The pipe operator chains them: `prompt | model | parser` becomes one runnable you can `.invoke()` / `.stream()` / `.batch()`."
          color={VIZ.teal}
        />
        <FactCard
          tag="Streaming by default"
          body="`.stream()` walks the chain and yields tokens as the model produces them. No extra plumbing needed &mdash; LCEL knows which links can stream and which can't."
          color={VIZ.teal}
        />
        <FactCard
          tag="Batch + async"
          body="`.batch([...])` parallelizes inputs across the LLM's concurrency budget. `.ainvoke()` / `.astream()` give you the async variants for FastAPI handlers."
          color={VIZ.teal}
        />
        <FactCard
          tag="Auto-traced"
          body="If LangSmith is configured, every link in the chain becomes a span automatically. The same code you wrote for prod becomes the trace you debug in dev."
          color={VIZ.teal}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.teal}
        presets={[
          'What is LCEL and why does the | operator matter?',
          'How does LCEL streaming actually work under the hood?',
          'When is raw OpenAI SDK still simpler than LCEL?',
        ]}
        defaultQuestion="What does LangChain LCEL give me over raw API calls?"
      />

      <LCELPipeVisual />

      <ExplainerBlock
        title="The simplest framework win"
        body="LCEL is the version of LangChain that earns its keep. Three primitives composed with a pipe is genuinely shorter and cleaner than the equivalent raw-SDK code, and you get streaming + batching + tracing as a side effect. The escape hatch: for true one-shot calls, raw `client.chat.completions.create()` is still two lines and zero abstractions. The break-even point is roughly &ldquo;more than one prompt template I want to share, or anything that needs to stream cleanly.&rdquo;"
      />
    </div>
  );
}

function LCELPipeVisual() {
  const [running, setRunning] = useState(false);

  const animate = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 1800);
  };

  const stages = [
    { name: 'PromptTemplate', color: VIZ.teal, hint: 'fill the slots' },
    { name: 'ChatOpenAI', color: VIZ.blue, hint: 'call the model' },
    { name: 'StrOutputParser', color: VIZ.violet, hint: 'extract the string' },
  ];

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The pipe in action
        </h3>
        <p className="text-sm text-muted">
          The three-stage canonical LCEL chain. Hit run to watch a token
          travel through the pipes left to right.
        </p>
      </div>

      <div className="border border-rule bg-paper p-4 space-y-4">
        <div className="flex items-stretch gap-2">
          {stages.map((s, i) => (
            <div key={s.name} className="flex flex-1 items-stretch gap-2">
              <div
                className="relative flex-1 border bg-background p-3 text-center"
                style={{ borderTop: `2px solid ${s.color}` }}
              >
                <div
                  className="font-mono text-[11px]"
                  style={{ color: s.color }}
                >
                  {s.name}
                </div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                  {s.hint}
                </div>
                {running && (
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-1/2 inline-block h-2 w-2 -translate-x-1/2 rounded-full"
                    style={{
                      background: s.color,
                      animation: `lcelPulse 1.8s ease-in-out ${i * 0.4}s`,
                    }}
                  />
                )}
              </div>
              {i < stages.length - 1 && (
                <div className="flex items-center font-mono text-2xl text-muted">
                  |
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <code className="font-mono text-[11px] text-foreground/70">
            chain = prompt | model | parser
          </code>
          <button
            onClick={animate}
            disabled={running}
            className="border border-rule px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-foreground/80 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
          >
            {running ? 'running…' : 'animate chain →'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes lcelPulse {
          0% {
            opacity: 0;
            transform: translate(-50%, 0) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.4);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 0) scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}

// ─── N77 — LangChain Agents + Framework Picker + ReAct stepper ──

function NodeAgents({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="LangChain Agents + ReAct"
        hint="When the chain doesn't know in advance which tool it'll need, you give the model a list and let it pick — that's an agent. The loop the model runs is called ReAct: Thought → Action → Observation → Thought → … → Final Answer."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Tool use"
          body="Each tool is a Python function with a name, description, and arg schema. The agent sees the descriptions in its system prompt and emits structured tool calls."
          color={VIZ.amber}
        />
        <FactCard
          tag="The ReAct loop"
          body="Reasoning + Acting. The model writes a Thought, picks an Action (tool + args), gets an Observation back, then loops. Final answer when it has enough info."
          color={VIZ.amber}
        />
        <FactCard
          tag="Where it fails"
          body="Agents are noisy and slow. They burn 3-10x the tokens of an equivalent chain. Worth it only when the tool sequence is genuinely unknown ahead of time."
          color={VIZ.amber}
        />
        <FactCard
          tag="LangGraph is the upgrade"
          body="LangChain's own docs recommend LangGraph for any non-trivial agent. The classic AgentExecutor is in maintenance mode &mdash; covered in N79 below."
          color={VIZ.amber}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.amber}
        presets={[
          'What is the ReAct pattern and why is it the default for tool-using agents?',
          'When should I use a chain instead of an agent?',
          'How does LangGraph improve on the AgentExecutor?',
        ]}
        defaultQuestion="What is a LangChain agent and what does the ReAct loop look like?"
      />

      <FrameworkPickerForm provider={provider} setProvider={setProvider} />

      <ExplainerBlock
        title="When orchestration earns its keep"
        body="Agents are the most-misused part of the framework world. The right reason to reach for one is: &ldquo;I have N tools and the right sequence depends on the input.&rdquo; The wrong reason is &ldquo;agents sound cool.&rdquo; If you can write the tool calls as a fixed chain &mdash; even a long one &mdash; that's almost always cheaper, faster, and easier to debug. The picker above is honest about this: ask it for `raw_api` or `simple_chain` and it will tell you to skip frameworks entirely."
      />
    </div>
  );
}

type FrameworkPickerResponse = {
  use_case: string;
  framework: string;
  reason: string;
  alternatives: string[];
  complexity: 'low' | 'medium' | 'high';
  react_loop_steps: { step: 'Thought' | 'Action' | 'Observation'; example: string }[] | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

const USE_CASES: { id: string; label: string; hint: string }[] = [
  { id: 'simple_chain', label: 'Simple chain', hint: 'prompt → LLM → parse' },
  { id: 'doc_qa', label: 'Doc Q&A', hint: 'RAG over a corpus' },
  { id: 'stateful_agent', label: 'Stateful agent', hint: 'one agent + tools' },
  { id: 'multi_agent', label: 'Multi-agent', hint: 'specialists handing off' },
  { id: 'raw_api', label: 'Raw API', hint: 'is a framework worth it?' },
];

function FrameworkPickerForm({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  const [useCase, setUseCase] = useState('stateful_agent');
  const [result, setResult] = useState<FrameworkPickerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day16/framework-picker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_case: useCase, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as FrameworkPickerResponse);
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
          Pick the right framework
        </h3>
        <p className="text-sm text-muted">
          Five common use cases. Pick one, run, and the model recommends a
          framework with a complexity badge. Agent use cases get a ReAct loop
          walkthrough below.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          setProvider={setProvider}
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          {USE_CASES.map((uc) => {
            const active = uc.id === useCase;
            return (
              <button
                key={uc.id}
                type="button"
                onClick={() => setUseCase(uc.id)}
                disabled={loading}
                className={[
                  'flex flex-col items-start gap-0.5 border px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-wide transition disabled:opacity-40',
                  active
                    ? 'border-accent bg-accent text-background'
                    : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
                ].join(' ')}
              >
                <span>{uc.label}</span>
                <span
                  className={[
                    'text-[9px] normal-case tracking-normal',
                    active ? 'text-background/80' : 'text-muted',
                  ].join(' ')}
                >
                  {uc.hint}
                </span>
              </button>
            );
          })}
        </div>
        <SubmitButton
          loading={loading}
          idle="Pick framework →"
          busy="Recommending…"
          disabled={loading}
        />
      </form>

      {error && <ErrorBox message={error} />}
      {result && <PickerResult result={result} />}
    </div>
  );
}

const COMPLEXITY_COLOR: Record<'low' | 'medium' | 'high', string> = {
  low: VIZ.green,
  medium: VIZ.amber,
  high: VIZ.red,
};

function PickerResult({ result }: { result: FrameworkPickerResponse }) {
  return (
    <div className="space-y-4">
      <div
        className="border border-rule bg-paper p-4 space-y-3"
        style={{ borderTop: `2px solid ${VIZ.amber}` }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-serif text-2xl font-semibold">
            {result.framework}
          </h4>
          <span
            className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
            style={{
              borderColor: COMPLEXITY_COLOR[result.complexity],
              color: COMPLEXITY_COLOR[result.complexity],
              background: `${COMPLEXITY_COLOR[result.complexity]}1F`,
            }}
          >
            {result.complexity} complexity
          </span>
        </div>
        {result.reason && (
          <p className="text-sm leading-relaxed text-foreground/85">
            {result.reason}
          </p>
        )}
        {result.alternatives.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              also consider
            </span>
            {result.alternatives.map((a, i) => (
              <span
                key={i}
                className="border border-rule bg-background px-2 py-0.5 text-[11px] text-foreground/80"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        <Footer>
          {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
          {result.latency_ms}ms
        </Footer>
      </div>

      {result.react_loop_steps && (
        <ReActStepper steps={result.react_loop_steps} />
      )}
    </div>
  );
}

const REACT_STEP_COLOR: Record<'Thought' | 'Action' | 'Observation', string> = {
  Thought: VIZ.blue,
  Action: VIZ.amber,
  Observation: VIZ.green,
};

function ReActStepper({
  steps,
}: {
  steps: { step: 'Thought' | 'Action' | 'Observation'; example: string }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3 border border-rule bg-paper p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-serif text-lg font-semibold">
          ReAct loop walkthrough
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActive((a) => Math.max(0, a - 1))}
            disabled={active === 0}
            className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/80 transition hover:border-foreground hover:text-foreground disabled:opacity-30"
          >
            ← prev
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            step {active + 1} / {steps.length}
          </span>
          <button
            onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}
            disabled={active === steps.length - 1}
            className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/80 transition hover:border-foreground hover:text-foreground disabled:opacity-30"
          >
            next →
          </button>
        </div>
      </div>

      <ol className="space-y-2">
        {steps.map((s, i) => {
          const isActive = i === active;
          const seen = i <= active;
          const color = REACT_STEP_COLOR[s.step];
          return (
            <li
              key={i}
              className={[
                'border bg-background p-3 transition',
                isActive ? '' : 'opacity-50',
              ].join(' ')}
              style={{
                borderLeft: `3px solid ${seen ? color : VIZ.grey}`,
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: seen ? color : VIZ.grey }}
                >
                  {s.step}
                </span>
                <span className="font-mono text-[10px] text-muted">
                  iter {Math.floor(i / 3) + 1}
                </span>
              </div>
              <p className="mt-1 font-mono text-[12px] leading-snug text-foreground/85">
                {s.step === 'Action' ? <code>{s.example}</code> : s.example}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── N78 — LlamaIndex + Ingestion/Query split ────────────────────

function NodeLlamaIndex({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="LlamaIndex"
        hint="The framework with the strongest opinions about RAG. Ingest connectors, node parsers, multiple index types (vector / keyword / property graph), and query engines that wrap them — all designed around &lsquo;your data + the LLM&rsquo; specifically."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Ingestion-first"
          body="160+ LlamaHub readers cover PDFs, Notion, Slack, S3, Confluence, databases. Each yields Documents that flow into a NodeParser, then into an Index."
          color={VIZ.violet}
        />
        <FactCard
          tag="Multiple index types"
          body="VectorStoreIndex is the default; KeywordTableIndex for BM25-style retrieval; PropertyGraphIndex for entity-relationship graphs over your docs."
          color={VIZ.violet}
        />
        <FactCard
          tag="Query engines"
          body="A QueryEngine wraps an index + retriever + synthesizer + optional postprocessors (reranking, citation). Swap pieces independently."
          color={VIZ.violet}
        />
        <FactCard
          tag="When over LangChain"
          body="Pure document Q&A is LlamaIndex's sweet spot. Need tool use, multi-step planning, custom control flow? LangChain / LangGraph is usually better."
          color={VIZ.violet}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.violet}
        presets={[
          'When should I use LlamaIndex over LangChain for RAG?',
          'What is the difference between a Retriever and a QueryEngine in LlamaIndex?',
          'How does PropertyGraphIndex work?',
        ]}
        defaultQuestion="What is LlamaIndex and where does it beat LangChain?"
      />

      <IngestQueryVisual />

      <ExplainerBlock
        title="The RAG specialist"
        body="LlamaIndex is the framework you reach for when the question is shaped like &lsquo;answer questions about a corpus.&rsquo; The data connectors are deeper than LangChain&apos;s, the index abstractions are stronger, and the query engines have batteries-included reranking + citation. The cost: it&apos;s less general. For anything outside the RAG box &mdash; arbitrary tool use, complex flow control, agent swarms &mdash; LangChain or LangGraph fit the shape better."
      />
    </div>
  );
}

function IngestQueryVisual() {
  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Two phases, one index
        </h3>
        <p className="text-sm text-muted">
          Ingestion happens once (or on a schedule); querying happens per
          request. The Index is the boundary between them.
        </p>
      </div>

      <div className="border border-rule bg-paper p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-2">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: VIZ.coral }}
            >
              Ingestion · build time
            </div>
            <FlowBox label="PDF / DB / API" color={VIZ.coral} />
            <FlowArrow />
            <FlowBox label="LlamaHub Reader" color={VIZ.coral} mono />
            <FlowArrow />
            <FlowBox label="NodeParser (chunks)" color={VIZ.coral} mono />
            <FlowArrow />
            <FlowBox label="VectorStoreIndex" color={VIZ.violet} mono />
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div
              className="h-full w-px"
              style={{ background: VIZ.grey, opacity: 0.4 }}
            />
          </div>
          <div className="md:hidden">
            <div
              className="h-px w-full"
              style={{ background: VIZ.grey, opacity: 0.4 }}
            />
          </div>

          <div className="space-y-2">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: VIZ.blue }}
            >
              Query · request time
            </div>
            <FlowBox label="User question" color={VIZ.blue} />
            <FlowArrow />
            <FlowBox label="Retriever" color={VIZ.blue} mono />
            <FlowArrow />
            <FlowBox label="ResponseSynthesizer" color={VIZ.blue} mono />
            <FlowArrow />
            <FlowBox label="Final answer" color={VIZ.green} />
          </div>
        </div>

        <div className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          ↑ shared via the same VectorStoreIndex ↑
        </div>
      </div>
    </div>
  );
}

function FlowBox({
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
        'border bg-background px-3 py-1.5 text-center text-[12px]',
        mono ? 'font-mono text-[11px]' : '',
      ].join(' ')}
      style={{ borderLeft: `2px solid ${color}` }}
    >
      {label}
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="text-center font-mono text-[10px] text-muted">↓</div>
  );
}

// ─── N79 — LangGraph + State graph ───────────────────────────────

function NodeLangGraph({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="LangGraph"
        hint="A typed state machine on top of LangChain. Nodes are Python functions that mutate a shared state object; edges (including conditional ones) route control between them. The recommended way to build any non-trivial agent in 2026."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Typed state"
          body="Declare the state shape as a TypedDict / Pydantic model. Every node receives and returns a partial — LangGraph merges them. No accidental key collisions."
          color={VIZ.green}
        />
        <FactCard
          tag="Conditional edges"
          body="`add_conditional_edges(agent, route_fn, {'tools': 'tools', 'end': END})` routes based on a function over state — clean alternative to AgentExecutor's hidden control flow."
          color={VIZ.green}
        />
        <FactCard
          tag="Checkpointing + HITL"
          body="Built-in support for persisting state to a checkpointer (SQLite / Postgres) and pausing for human-in-the-loop approval before a node runs."
          color={VIZ.green}
        />
        <FactCard
          tag="Drop-in replacement"
          body="LangChain's own docs now recommend LangGraph for new agents. AgentExecutor still works but is in maintenance mode &mdash; new features land in LangGraph."
          color={VIZ.green}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.green}
        presets={[
          'How does LangGraph compare to the old AgentExecutor?',
          'What does a typed StateGraph buy me?',
          'How do conditional edges work in LangGraph?',
        ]}
        defaultQuestion="What is LangGraph and why is it the recommended agent path now?"
      />

      <LangGraphStateVisual />

      <ExplainerBlock
        title="The graph upgrade"
        body="LangGraph&apos;s pitch is that agents are state machines and you should write them as state machines. Once a flow has more than two or three branches &mdash; tool retries, human approval, conditional next-step routing &mdash; the explicit graph is dramatically easier to read and debug than the implicit AgentExecutor loop. The cost is one extra concept: you have to think about state shape and edge functions instead of just &lsquo;agent + tools.&rsquo; Worth it for anything beyond the simplest agent."
      />
    </div>
  );
}

function LangGraphStateVisual() {
  const STEPS = [
    {
      label: 'START',
      state: { messages: [], iterations: 0 },
    },
    {
      label: 'agent',
      state: {
        messages: ['user: weather in SF?'],
        iterations: 1,
      },
    },
    {
      label: 'tools (conditional edge)',
      state: {
        messages: ['user: weather in SF?', 'agent: call get_weather'],
        iterations: 1,
      },
    },
    {
      label: 'agent',
      state: {
        messages: [
          'user: weather in SF?',
          'agent: call get_weather',
          'tool: 62°F, cloudy',
        ],
        iterations: 2,
      },
    },
    {
      label: 'END',
      state: {
        messages: [
          'user: weather in SF?',
          'agent: call get_weather',
          'tool: 62°F, cloudy',
          'agent: Currently 62°F and cloudy in SF.',
        ],
        iterations: 2,
        final: true,
      },
    },
  ];
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const nodes = [
    { id: 'START', x: 5 },
    { id: 'agent', x: 30 },
    { id: 'tools', x: 60 },
    { id: 'END', x: 90 },
  ];
  const activeNode = (() => {
    if (current.label.startsWith('tools')) return 'tools';
    if (current.label === 'agent') return 'agent';
    if (current.label === 'START') return 'START';
    return 'END';
  })();

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          A StateGraph stepping through one turn
        </h3>
        <p className="text-sm text-muted">
          Step the execution forward. The active node colors green; the state
          panel shows what changed.
        </p>
      </div>

      <div className="border border-rule bg-paper p-4 space-y-4">
        <div className="relative h-20">
          {nodes.map((n) => {
            const active = n.id === activeNode;
            return (
              <div
                key={n.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${n.x}%` }}
              >
                <div
                  className="border px-3 py-1.5 font-mono text-[11px]"
                  style={{
                    borderColor: active ? VIZ.green : VIZ.grey,
                    color: active ? VIZ.green : VIZ.grey,
                    background: active ? `${VIZ.green}1F` : 'transparent',
                  }}
                >
                  {n.id}
                </div>
              </div>
            );
          })}
          {/* edges: START → agent → tools → agent (loop) → END */}
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              <marker
                id="lg-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={VIZ.grey} />
              </marker>
            </defs>
            <line
              x1="10"
              y1="50"
              x2="26"
              y2="50"
              stroke={VIZ.grey}
              strokeWidth="0.8"
              markerEnd="url(#lg-arrow)"
            />
            <line
              x1="34"
              y1="50"
              x2="56"
              y2="50"
              stroke={VIZ.grey}
              strokeWidth="0.8"
              markerEnd="url(#lg-arrow)"
            />
            <path
              d="M 60 45 Q 45 20 30 45"
              fill="none"
              stroke={VIZ.grey}
              strokeWidth="0.8"
              markerEnd="url(#lg-arrow)"
            />
            <line
              x1="34"
              y1="55"
              x2="86"
              y2="55"
              stroke={VIZ.grey}
              strokeWidth="0.8"
              strokeDasharray="2 2"
              markerEnd="url(#lg-arrow)"
            />
          </svg>
          <div
            className="absolute font-mono text-[9px] uppercase tracking-[0.18em] text-muted"
            style={{ left: '40%', top: '5%' }}
          >
            loop while tool calls
          </div>
          <div
            className="absolute font-mono text-[9px] uppercase tracking-[0.18em] text-muted"
            style={{ left: '50%', top: '70%' }}
          >
            else
          </div>
        </div>

        <pre className="overflow-x-auto border border-rule bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground/85">
{JSON.stringify(current.state, null, 2)}
        </pre>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            step {step + 1} / {STEPS.length} · {current.label}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/80 transition hover:border-foreground hover:text-foreground disabled:opacity-30"
            >
              ← prev
            </button>
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={step === STEPS.length - 1}
              className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/80 transition hover:border-foreground hover:text-foreground disabled:opacity-30"
            >
              next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── N80 — CrewAI + 3-agent handoff ──────────────────────────────

function NodeCrewAI({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="CrewAI"
        hint="Multi-agent orchestration with strong opinions. You define agents with a role + goal + tools, define tasks that say 'agent X does Y,' and CrewAI runs them sequentially or in parallel. The framework that makes 'team of agents' feel natural."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Role-based agents"
          body="Each Agent has role / goal / backstory. The framework bakes these into the system prompt for that agent — the role is its identity, not just a label."
          color={VIZ.coral}
        />
        <FactCard
          tag="Sequential or parallel"
          body="`Process.sequential` (default) runs tasks in order, passing outputs forward. `Process.hierarchical` adds a manager agent that delegates."
          color={VIZ.coral}
        />
        <FactCard
          tag="Tasks > prompts"
          body="A Task ties a description + expected_output + the agent that owns it. Forces you to specify the contract for each handoff."
          color={VIZ.coral}
        />
        <FactCard
          tag="When over LangGraph"
          body="CrewAI for 'team of specialists' use cases (researcher + writer + editor). LangGraph when the control flow is the hard part, not the agent roles."
          color={VIZ.coral}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.coral}
        presets={[
          'When is CrewAI a better fit than LangGraph?',
          'What does Process.hierarchical actually do?',
          'How does CrewAI compare to AutoGen?',
        ]}
        defaultQuestion="What is CrewAI and what do role + goal actually do for the model?"
      />

      <CrewKickoffVisual />

      <ExplainerBlock
        title="The team metaphor"
        body="CrewAI bets on a metaphor: orchestration is easier when you think about it as a small team of specialists, each with a defined role. For some use cases that&apos;s genuinely the right mental model &mdash; content pipelines, research-then-write, code-then-review. For others it&apos;s ceremony around what could have been three LCEL chains. The honest framing: CrewAI is a productivity boost when the team metaphor fits; otherwise the same work in LangGraph is cheaper and more transparent."
      />
    </div>
  );
}

function CrewKickoffVisual() {
  const AGENTS = [
    {
      name: 'Researcher',
      role: 'Senior researcher',
      goal: 'Find recent sources on the topic',
      tools: ['search_web', 'fetch_url'],
      color: VIZ.blue,
    },
    {
      name: 'Writer',
      role: 'Tech writer',
      goal: 'Draft a 300-word brief from the research',
      tools: ['markdown_writer'],
      color: VIZ.violet,
    },
    {
      name: 'Reviewer',
      role: 'Editor',
      goal: 'Tighten copy and flag unsupported claims',
      tools: ['grammar_check'],
      color: VIZ.coral,
    },
  ];
  const [running, setRunning] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  const kickoff = () => {
    setRunning(true);
    setActiveIdx(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= AGENTS.length) {
        clearInterval(id);
        setTimeout(() => {
          setRunning(false);
          setActiveIdx(-1);
        }, 800);
      } else {
        setActiveIdx(i);
      }
    }, 900);
  };

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          A three-agent crew kicking off
        </h3>
        <p className="text-sm text-muted">
          Sequential process. Each agent finishes its task and hands off to
          the next one&apos;s task. Press kickoff to step through.
        </p>
      </div>

      <div className="border border-rule bg-paper p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch">
          {AGENTS.map((a, i) => (
            <div key={a.name} className="contents">
              <div
                className="border bg-background p-3 transition"
                style={{
                  borderTop: `2px solid ${a.color}`,
                  background:
                    activeIdx === i ? `${a.color}14` : undefined,
                  opacity:
                    activeIdx === -1 || activeIdx >= i ? 1 : 0.5,
                }}
              >
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: a.color }}
                >
                  {a.name}
                </div>
                <div className="mt-1 text-[12px] font-semibold">
                  {a.role}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-foreground/70">
                  {a.goal}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.tools.map((t) => (
                    <span
                      key={t}
                      className="border px-1.5 py-0.5 font-mono text-[9px]"
                      style={{
                        borderColor: a.color,
                        color: a.color,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {i < AGENTS.length - 1 && (
                <div className="flex items-center justify-center font-mono text-lg text-muted">
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <code className="font-mono text-[11px] text-foreground/70">
            crew.kickoff(inputs=&#123;...&#125;)
          </code>
          <button
            onClick={kickoff}
            disabled={running}
            className="border border-rule px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-foreground/80 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
          >
            {running ? 'kicking off…' : 'kickoff →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Framework comparison cards (always-visible footer section) ──

const FRAMEWORKS_COMPARE = [
  {
    name: 'LangChain',
    desc: 'Compose prompts, models, parsers, and tools as runnables.',
    bestFor: 'Glue chains + agents',
    complexity: 'medium' as const,
    color: VIZ.teal,
  },
  {
    name: 'LlamaIndex',
    desc: 'Specialized RAG: 160+ data readers, multiple index types.',
    bestFor: 'Document Q&A',
    complexity: 'medium' as const,
    color: VIZ.violet,
  },
  {
    name: 'LangGraph',
    desc: 'Typed state machine for agents. The recommended path for new agent code.',
    bestFor: 'Stateful agents',
    complexity: 'high' as const,
    color: VIZ.green,
  },
  {
    name: 'CrewAI',
    desc: 'Role-based multi-agent orchestration with sequential or hierarchical processes.',
    bestFor: 'Teams of specialists',
    complexity: 'high' as const,
    color: VIZ.coral,
  },
];

function FrameworkCompareSection() {
  return (
    <section className="space-y-3 border-t border-rule pt-8">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl font-semibold">
          The four-at-a-glance card
        </h2>
        <p className="text-sm text-muted">
          The framework family in one row, with the use case each is best at.
          Stays visible regardless of which node tab you&apos;re on.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FRAMEWORKS_COMPARE.map((f) => (
          <div
            key={f.name}
            className="space-y-2 border bg-paper p-4"
            style={{ borderTop: `2px solid ${f.color}` }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-serif text-lg font-semibold">{f.name}</h3>
              <span
                className="border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide"
                style={{
                  borderColor: COMPLEXITY_COLOR[f.complexity],
                  color: COMPLEXITY_COLOR[f.complexity],
                  background: `${COMPLEXITY_COLOR[f.complexity]}1F`,
                }}
              >
                {f.complexity}
              </span>
            </div>
            <p className="text-[12px] leading-snug text-foreground/80">
              {f.desc}
            </p>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: f.color }}
            >
              {f.bestFor}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

