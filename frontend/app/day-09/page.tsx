'use client';

import { useState } from 'react';
import ModelSwitcher from '../components/ModelSwitcher';
import { Markdown } from '../components/Markdown';
import { useNodeProgress } from '../components/useNodeProgress';
import DayPager from '../components/DayPager';

const NODES = [
  { id: 'N41', label: 'What are agents', title: 'What are AI agents?' },
  { id: 'N42', label: 'Use cases', title: 'Agentic use cases' },
  { id: 'N43', label: 'Tools', title: 'Tools & function calling' },
  { id: 'N44', label: 'Multi-agent', title: 'Multi-agent systems' },
  { id: 'N45', label: 'Frameworks', title: 'Building AI agents' },
];

const VIZ = {
  green: '#1D9E75',
  blue: '#378ADD',
  violet: '#7F77DD',
  amber: '#FAC775',
  coral: '#F5C4B3',
  grey: '#9CA3AF',
} as const;

const API = 'http://localhost:8000';

export default function Day09Page() {
  const [activeId, setActiveId] = useState('N41');
  const progress = useNodeProgress(9);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 09 · AI Agents
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
          The model can <span className="text-accent">act</span>.
        </h1>
        <p className="text-sm text-muted">
          Give an LLM tools and a loop and it becomes an agent: pick a tool,
          read the result, decide what to do next. Each tab is N41–N45.
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

      <div className={activeId === 'N41' ? undefined : 'hidden'}>
        <NodeWhatIs />
      </div>
      <div className={activeId === 'N42' ? undefined : 'hidden'}>
        <NodeUseCases />
      </div>
      <div className={activeId === 'N43' ? undefined : 'hidden'}>
        <NodeTools />
      </div>
      <div className={activeId === 'N44' ? undefined : 'hidden'}>
        <NodeMultiAgent />
      </div>
      <div className={activeId === 'N45' ? undefined : 'hidden'}>
        <NodeFrameworks />
      </div>
      <DayPager day={9} />
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
  label = 'Agent provider',
}: {
  provider: string;
  onChange: (p: string) => void;
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
        onChange={onChange}
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

// ─── agent response types + step renderer ─────────────────────────

type AgentStep =
  | { kind: 'user'; content: string; agent?: string }
  | { kind: 'thought'; iteration: number; content: string; agent?: string }
  | {
      kind: 'tool_call';
      iteration: number;
      tool: string;
      args: Record<string, unknown>;
      result: Record<string, unknown>;
      is_error: boolean;
      agent?: string;
    }
  | { kind: 'answer'; iteration: number; content: string; agent?: string };

type AgentResponse = {
  question: string;
  answer: string;
  steps: AgentStep[];
  iterations: number;
  tools_used: string[];
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
  tools_available: string[];
};

const TOOL_COLOR: Record<string, string> = {
  calculate: VIZ.blue,
  get_weather: VIZ.amber,
  search_web: VIZ.violet,
};

function toolColor(name: string): string {
  return TOOL_COLOR[name] ?? VIZ.grey;
}

function StepTimeline({ steps }: { steps: AgentStep[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={i}>
          <StepRow step={s} index={i} />
        </li>
      ))}
    </ol>
  );
}

function StepRow({ step, index }: { step: AgentStep; index: number }) {
  if (step.kind === 'user') {
    return (
      <div
        className="border bg-paper p-3"
        style={{ borderLeft: `2px solid ${VIZ.grey}` }}
      >
        <KindBadge kind="user" iteration={null} agent={step.agent} />
        <p className="mt-1 text-[13px] leading-relaxed text-foreground/90">
          {step.content}
        </p>
      </div>
    );
  }
  if (step.kind === 'thought') {
    return (
      <div
        className="border bg-paper p-3"
        style={{ borderLeft: `2px solid ${VIZ.violet}` }}
      >
        <KindBadge
          kind="thought"
          iteration={step.iteration}
          agent={step.agent}
        />
        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
          {step.content}
        </p>
      </div>
    );
  }
  if (step.kind === 'tool_call') {
    const color = toolColor(step.tool);
    return (
      <div
        className="space-y-2 border bg-paper p-3"
        style={{ borderLeft: `2px solid ${color}` }}
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <KindBadge
            kind="tool_call"
            iteration={step.iteration}
            agent={step.agent}
          />
          <span
            className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
            style={{ borderColor: color, color, background: `${color}1F` }}
          >
            {step.tool}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
            #{index + 1}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              args
            </div>
            <pre className="mt-0.5 whitespace-pre-wrap wrap-break-word border border-rule bg-background p-2 font-mono text-[11px] leading-snug text-foreground/85">
              {JSON.stringify(step.args, null, 2)}
            </pre>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              {step.is_error ? 'error' : 'result'}
            </div>
            <pre
              className="mt-0.5 whitespace-pre-wrap wrap-break-word border bg-background p-2 font-mono text-[11px] leading-snug"
              style={{
                borderColor: step.is_error ? VIZ.coral : 'var(--rule)',
                color: step.is_error ? VIZ.coral : 'var(--foreground)',
              }}
            >
              {JSON.stringify(step.result, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }
  // answer
  return (
    <div
      className="border bg-paper p-3"
      style={{ borderLeft: `2px solid ${VIZ.green}` }}
    >
      <KindBadge
        kind="answer"
        iteration={step.iteration}
        agent={step.agent}
      />
      <div className="mt-1 text-[14px] leading-relaxed text-foreground/95">
        <Markdown text={step.content} />
      </div>
    </div>
  );
}

function KindBadge({
  kind,
  iteration,
  agent,
}: {
  kind: AgentStep['kind'];
  iteration: number | null;
  agent?: string;
}) {
  const colorByKind: Record<AgentStep['kind'], string> = {
    user: VIZ.grey,
    thought: VIZ.violet,
    tool_call: VIZ.blue,
    answer: VIZ.green,
  };
  const labelByKind: Record<AgentStep['kind'], string> = {
    user: 'user',
    thought: 'thought',
    tool_call: 'tool call',
    answer: 'final answer',
  };
  const c = colorByKind[kind];
  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: c }}
      >
        {labelByKind[kind]}
      </span>
      {iteration !== null && (
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
          iter {iteration}
        </span>
      )}
      {agent && (
        <span className="border border-rule px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/70">
          {agent}
        </span>
      )}
    </span>
  );
}

// ─── /agent fetch helper, shared by N41/N42/N43 ────────────────────

async function runAgent(body: {
  question: string;
  provider: string;
  max_iterations?: number;
}): Promise<AgentResponse> {
  const r = await fetch(`${API}/day09/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
  return (await r.json()) as AgentResponse;
}

// ─── N41 — What are AI agents? ────────────────────────────────────

const AGENT_LOOP_STEPS: { label: string; sub: string; color: string }[] = [
  {
    label: '1 · Goal',
    sub: 'user gives the agent a question or task',
    color: VIZ.grey,
  },
  {
    label: '2 · Think',
    sub: 'LLM decides which tool (if any) to call',
    color: VIZ.violet,
  },
  {
    label: '3 · Act',
    sub: 'tool is executed with arguments',
    color: VIZ.blue,
  },
  {
    label: '4 · Observe',
    sub: 'tool result is fed back into context',
    color: VIZ.amber,
  },
  {
    label: '5 · Decide',
    sub: 'call another tool, or write the final answer',
    color: VIZ.green,
  },
];

function NodeWhatIs() {
  const [question, setQuestion] = useState('What is 24 * 7?');
  const [provider, setProvider] = useState('openai');
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await runAgent({ question, provider, max_iterations: 3 });
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="What are AI agents?"
        hint="An agent is a language model in a loop. Instead of replying in one shot, it can call tools (calculator, search, weather…), read the results, and decide whether to call another tool or stop."
      />

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          The agent loop
        </div>
        <ol className="grid grid-cols-1 gap-2 md:grid-cols-5">
          {AGENT_LOOP_STEPS.map((s) => (
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

      <form onSubmit={submit} className="space-y-4 border-t border-rule pt-6">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            ask the tiny agent something
          </span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            placeholder="What is 24 * 7?"
            className="w-full border border-rule bg-paper p-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <SubmitButton
          loading={loading}
          idle="Run the loop →"
          busy="Agent thinking…"
          disabled={loading || !question.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            trace — {result.iterations} iteration
            {result.iterations === 1 ? '' : 's'}, {result.steps.length} steps
          </div>
          <StepTimeline steps={result.steps} />
          <Footer>
            {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
            {result.latency_ms}ms
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="Why the loop matters"
        body="A plain chat call ends as soon as the model finishes speaking — it cannot reach out to anything. An agent loop turns each model reply into a decision point: did it ask for a tool? If yes, run the tool and feed the result back. The same LLM, wrapped in a few lines of orchestration, can now do arithmetic correctly, look facts up, and chain multiple actions together."
      />
    </div>
  );
}

// ─── N42 — Agentic use cases ──────────────────────────────────────

const USE_CASES: {
  id: string;
  title: string;
  color: string;
  blurb: string;
  prompt: string;
}[] = [
  {
    id: 'support',
    title: 'Customer support copilot',
    color: VIZ.blue,
    blurb:
      'Looks facts up in a knowledge base, calculates a refund, then drafts the reply.',
    prompt:
      "A customer wants a refund of 30% on a $189 order. What's the refund amount, and can you also search for 'RAG' so I have a relevant link to include?",
  },
  {
    id: 'research',
    title: 'Research analyst',
    color: VIZ.violet,
    blurb:
      'Pulls multiple snippets from the web, synthesizes them into a brief.',
    prompt:
      'Briefly explain how AI agents work and how they relate to function calling. Search the web for both.',
  },
  {
    id: 'ops',
    title: 'Travel planner',
    color: VIZ.amber,
    blurb:
      'Checks the weather, does a quick numeric estimate, recommends a plan.',
    prompt:
      "I'm visiting Depok next weekend. What's the weather like, and if I budget $40/day for 3 days, how much total?",
  },
  {
    id: 'devops',
    title: 'Data sidekick',
    color: VIZ.green,
    blurb:
      'Combines a calculation with a fact lookup, useful for analytics chats.',
    prompt:
      "Calculate the cost of 1,200,000 input tokens at $0.27 per 1M, then search for 'embedding' so I can quote the definition.",
  },
];

function NodeUseCases() {
  const [provider, setProvider] = useState('openai');
  const [activeCase, setActiveCase] = useState(USE_CASES[0].id);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (useCaseId: string) => {
    const uc = USE_CASES.find((u) => u.id === useCaseId);
    if (!uc) return;
    setActiveCase(useCaseId);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await runAgent({ question: uc.prompt, provider });
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Agentic use cases"
        hint="Pick a real-world scenario. Each one demonstrates a different mix of the same three tools — support, research, ops, analytics — to show that an agent is just a tool selection problem."
      />

      <ProviderRow
        provider={provider}
        onChange={setProvider}
        disabled={loading}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {USE_CASES.map((uc) => {
          const active = uc.id === activeCase;
          return (
            <div
              key={uc.id}
              className="space-y-2 border bg-paper p-4"
              style={{
                borderTopColor: active ? uc.color : 'var(--rule)',
                borderRightColor: active ? uc.color : 'var(--rule)',
                borderBottomColor: active ? uc.color : 'var(--rule)',
                borderLeftColor: uc.color,
                borderLeftWidth: 2,
              }}
            >
              <div
                className="font-mono text-[11px] uppercase tracking-[0.18em]"
                style={{ color: uc.color }}
              >
                {uc.title}
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/85">
                {uc.blurb}
              </p>
              <div className="border border-dashed border-rule bg-background p-2 text-[12px] italic text-foreground/70">
                “{uc.prompt}”
              </div>
              <button
                type="button"
                onClick={() => run(uc.id)}
                disabled={loading}
                className="border border-foreground bg-foreground px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
              >
                {loading && active ? 'running…' : 'run this case →'}
              </button>
            </div>
          );
        })}
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3 border-t border-rule pt-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            trace — used: {result.tools_used.join(', ') || '(none)'}
          </div>
          <StepTimeline steps={result.steps} />
          <Footer>
            {result.provider} · {result.model} · {result.iterations} iter ·{' '}
            {result.total_tokens} tok · {result.latency_ms}ms
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="The shape is always the same"
        body="Whether it's customer support, research, planning, or analytics, the underlying mechanic is identical: hand the model a small toolbox and let it pick. Most production agents are 80% prompt engineering of the tool catalog and 20% actual orchestration code. Hard problems usually mean too many tools, not too few."
      />
    </div>
  );
}

// ─── N43 — Tools & function calling ───────────────────────────────

const TOOL_DEFS: {
  name: string;
  color: string;
  signature: string;
  description: string;
  example: string;
}[] = [
  {
    name: 'calculate',
    color: VIZ.blue,
    signature: 'calculate(expression: string)',
    description:
      'Evaluates a safe arithmetic expression (no names, no calls). Use it for any math.',
    example: 'calculate({ "expression": "24 * 7" })',
  },
  {
    name: 'get_weather',
    color: VIZ.amber,
    signature: 'get_weather(city: string)',
    description:
      'Deterministic mock weather, seeded by city name so the same input always returns the same output.',
    example: 'get_weather({ "city": "Depok" })',
  },
  {
    name: 'search_web',
    color: VIZ.violet,
    signature: 'search_web(query: string)',
    description:
      'Canned demo search index of AI-engineering snippets — no real network call.',
    example: 'search_web({ "query": "what is RAG" })',
  },
];

const N43_PRESETS = [
  'What is 24 * 7 and what is the weather in Depok?',
  'Search for pgvector then tell me 2 + 2.',
  'How does the agent loop work? Use search_web.',
];

function NodeTools() {
  const [question, setQuestion] = useState(N43_PRESETS[0]);
  const [provider, setProvider] = useState('openai');
  const [maxIter, setMaxIter] = useState(5);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await runAgent({
        question,
        provider,
        max_iterations: maxIter,
      });
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tools & function calling"
        hint="The LLM never executes tools itself — it emits a JSON request naming a tool and its arguments. Your code runs the function and feeds the result back. The loop ends when the model stops asking for tools."
      />

      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          The tool catalog the model sees
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {TOOL_DEFS.map((t) => (
            <div
              key={t.name}
              className="space-y-1.5 border bg-paper p-3"
              style={{ borderLeft: `2px solid ${t.color}` }}
            >
              <div
                className="font-mono text-[11px] uppercase tracking-[0.18em]"
                style={{ color: t.color }}
              >
                {t.name}
              </div>
              <div className="font-mono text-[11px] text-foreground/80">
                {t.signature}
              </div>
              <p className="text-[12px] leading-snug text-foreground/75">
                {t.description}
              </p>
              <pre className="whitespace-pre-wrap border border-rule bg-background p-1.5 font-mono text-[10px] leading-snug text-foreground/80">
                {t.example}
              </pre>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 border-t border-rule pt-6">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          {N43_PRESETS.map((p, i) => (
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
          rows={2}
          placeholder="What is 24 * 7 and what's the weather in Depok?"
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              max iterations
            </span>
            <span className="font-mono text-[11px] text-foreground/80">
              {maxIter}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            value={maxIter}
            onChange={(e) => setMaxIter(parseInt(e.target.value, 10))}
            disabled={loading}
            className="w-full"
          />
        </div>
        <SubmitButton
          loading={loading}
          idle="Run the agent →"
          busy="Agent thinking…"
          disabled={loading || !question.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <SummaryStat label="iterations" value={String(result.iterations)} />
            <SummaryStat
              label="tools used"
              value={
                result.tools_used.length > 0
                  ? result.tools_used.join(', ')
                  : '(none)'
              }
            />
            <SummaryStat
              label="tokens · latency"
              value={`${result.total_tokens} · ${result.latency_ms}ms`}
            />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            full trace
          </div>
          <StepTimeline steps={result.steps} />
          <Footer>
            {result.provider} · {result.model} · {result.prompt_tokens}+
            {result.completion_tokens} tok
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="The model never runs the tool"
        body="Function calling is a structured request, not an execution. The model returns a JSON object that names the tool and its arguments; your application is what actually runs the function and sends the result back as a 'tool' message. The model then either calls another tool or writes a final answer. This division — the LLM picks, your code executes — is what makes the whole thing safe and debuggable."
      />
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-rule bg-paper p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[13px] text-foreground/90">
        {value}
      </div>
    </div>
  );
}

// ─── N44 — Multi-agent system ─────────────────────────────────────

type MultiAgentResponse = {
  topic: string;
  researcher: {
    facts: string;
    steps: AgentStep[];
    iterations: number;
    tools_used: string[];
    prompt_tokens: number;
    completion_tokens: number;
    latency_ms: number;
  };
  critic: {
    verdict: 'ship' | 'needs_more';
    feedback: string;
    prompt_tokens: number;
    completion_tokens: number;
    latency_ms: number;
  };
  writer: {
    answer: string;
    prompt_tokens: number;
    completion_tokens: number;
    latency_ms: number;
  };
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  provider: string;
  model: string;
};

const MULTI_PRESETS = [
  'Explain how RAG works and why pgvector is a sensible default.',
  'What is an AI agent and how is it different from a plain chatbot?',
  'How does embedding similarity power semantic search?',
];

function NodeMultiAgent() {
  const [topic, setTopic] = useState(MULTI_PRESETS[0]);
  const [provider, setProvider] = useState('openai');
  const [result, setResult] = useState<MultiAgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowTrace(false);
    try {
      const r = await fetch(`${API}/day09/multi-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as MultiAgentResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Multi-agent systems"
        hint="Three specialized agents pass work down a pipeline. The RESEARCHER uses tools to gather facts, the CRITIC inspects them, the WRITER composes the final answer using both. Same model, three distinct system prompts."
      />

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          The pipeline
        </div>
        <ol className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <PipelineCard
            color={VIZ.violet}
            tag="1 · Researcher"
            blurb="Tool-using loop that searches and computes; outputs a bullet list of facts."
          />
          <PipelineCard
            color={VIZ.amber}
            tag="2 · Critic"
            blurb='Inspects the facts, returns JSON {"verdict": "ship" | "needs_more", "feedback": "..."}.'
          />
          <PipelineCard
            color={VIZ.green}
            tag="3 · Writer"
            blurb="Composes a two-paragraph grounded answer, addressing critic feedback."
          />
        </ol>
      </div>

      <form onSubmit={submit} className="space-y-4 border-t border-rule pt-6">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
          label="All three agents use"
        />
        <div className="flex flex-wrap gap-2">
          {MULTI_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTopic(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              topic {i + 1}
            </button>
          ))}
        </div>
        <textarea aria-label="Form input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
          rows={2}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <SubmitButton
          loading={loading}
          idle="Run the pipeline →"
          busy="Three agents working…"
          disabled={loading || !topic.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <AgentColumn
              color={VIZ.violet}
              label="1 · Researcher"
              body={result.researcher.facts || '(no facts returned)'}
              footer={`${result.researcher.iterations} iter · ${
                result.researcher.tools_used.join(', ') || 'no tools'
              } · ${
                result.researcher.prompt_tokens +
                result.researcher.completion_tokens
              } tok · ${result.researcher.latency_ms}ms`}
            />
            <AgentColumn
              color={VIZ.amber}
              label={`2 · Critic — ${result.critic.verdict}`}
              body={result.critic.feedback || '(no feedback)'}
              footer={`${
                result.critic.prompt_tokens + result.critic.completion_tokens
              } tok · ${result.critic.latency_ms}ms`}
            />
            <AgentColumn
              color={VIZ.green}
              label="3 · Writer — final answer"
              body={result.writer.answer || '(no answer)'}
              footer={`${
                result.writer.prompt_tokens + result.writer.completion_tokens
              } tok · ${result.writer.latency_ms}ms`}
              renderAsMarkdown
            />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowTrace((v) => !v)}
              className="font-mono text-xs uppercase tracking-wide text-muted transition hover:text-foreground"
            >
              {showTrace
                ? '▾ hide researcher trace'
                : '▸ show researcher trace'}
            </button>
            {showTrace && <StepTimeline steps={result.researcher.steps} />}
          </div>

          <Footer>
            {result.provider} · {result.model} ·{' '}
            {result.total_prompt_tokens}+{result.total_completion_tokens} tok ·
            3 agents
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="Specialization is the trick"
        body="One agent with everything in its system prompt tends to drift — the researcher voice contaminates the writer's prose, the writer skips fact-checking. Splitting into roles gives each step a tight, single-purpose prompt and a clean handoff (here: a fact list, then a JSON verdict). The total cost is more tokens, but each call is shorter and more reliable, and the trace tells you exactly where a bad answer broke."
      />
    </div>
  );
}

function PipelineCard({
  color,
  tag,
  blurb,
}: {
  color: string;
  tag: string;
  blurb: string;
}) {
  return (
    <li
      className="space-y-1 border bg-paper p-3"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {tag}
      </div>
      <p className="text-[12px] leading-snug text-foreground/80">{blurb}</p>
    </li>
  );
}

function AgentColumn({
  color,
  label,
  body,
  footer,
  renderAsMarkdown,
}: {
  color: string;
  label: string;
  body: string;
  footer: string;
  renderAsMarkdown?: boolean;
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
      <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
        {renderAsMarkdown ? <Markdown text={body} /> : body}
      </div>
      <Footer>{footer}</Footer>
    </div>
  );
}

// ─── N45 — Building AI agents (frameworks) ────────────────────────

const FRAMEWORKS: {
  name: string;
  color: string;
  vibe: string;
  good_for: string;
  trade_off: string;
  snippet: string;
}[] = [
  {
    name: 'Raw OpenAI tool calls',
    color: VIZ.grey,
    vibe: 'No framework, just the chat completions API + a while-loop.',
    good_for:
      'Learning what an agent actually is. Total control, zero dependencies.',
    trade_off:
      'You write your own retry, parallel tool execution, tracing, and persistence.',
    snippet: `while True:
    msg = client.chat.completions.create(
        model=model, messages=msgs, tools=TOOLS
    ).choices[0].message
    if not msg.tool_calls:
        break
    for tc in msg.tool_calls:
        result = run_tool(tc.function.name, tc.function.arguments)
        msgs.append({"role": "tool", ...})`,
  },
  {
    name: 'OpenAI Agents SDK',
    color: VIZ.green,
    vibe: "Anthropic-style 'Agent' object with handoffs and guardrails baked in.",
    good_for:
      'Production OpenAI apps where you want tracing, sessions, and clean multi-agent handoffs.',
    trade_off:
      'OpenAI-flavored API; less natural fit if you also need DeepSeek/Groq at the framework layer.',
    snippet: `from agents import Agent, Runner, function_tool

@function_tool
def calculate(expression: str) -> float: ...

agent = Agent(name="Math", tools=[calculate])
result = Runner.run_sync(agent, "What is 24 * 7?")`,
  },
  {
    name: 'LangGraph',
    color: VIZ.violet,
    vibe: 'Model your agent as an explicit state graph: nodes and edges.',
    good_for:
      'Durable, branching workflows with human-in-the-loop pauses and checkpoints.',
    trade_off:
      'More upfront design — you describe the graph before you describe the agent.',
    snippet: `from langgraph.graph import StateGraph

graph = StateGraph(MyState)
graph.add_node("think", think_step)
graph.add_node("act", run_tool)
graph.add_edge("think", "act")
graph.add_conditional_edges("act", should_continue)
app = graph.compile()`,
  },
  {
    name: 'CrewAI',
    color: VIZ.amber,
    vibe: 'Role-based: declare a Researcher, an Analyst, a Writer.',
    good_for:
      "Multi-agent prototypes where each agent's job maps cleanly to a job title.",
    trade_off:
      "Opinionated metaphors (crew, task, process) — fights you if your problem doesn't map to roles.",
    snippet: `from crewai import Agent, Crew, Task

researcher = Agent(role="Researcher", tools=[search])
writer = Agent(role="Writer")
crew = Crew(
    agents=[researcher, writer],
    tasks=[Task(...), Task(...)],
)
crew.kickoff()`,
  },
];

function NodeFrameworks() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Building AI agents"
        hint="Once the loop clicks, the choice is mostly ergonomics. Four common shapes — from a raw while-loop (what this app uses) up to opinionated multi-agent frameworks."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {FRAMEWORKS.map((f) => (
          <div
            key={f.name}
            className="space-y-2 border bg-paper p-4"
            style={{
              borderTopColor: f.color,
              borderRightColor: f.color,
              borderBottomColor: f.color,
              borderLeftColor: f.color,
              borderLeftWidth: 2,
            }}
          >
            <div
              className="font-mono text-[11px] uppercase tracking-[0.18em]"
              style={{ color: f.color }}
            >
              {f.name}
            </div>
            <p className="text-[13px] leading-relaxed text-foreground/85">
              {f.vibe}
            </p>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-0.5 text-[12px]">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted">
                  good for
                </dt>
                <dd className="text-foreground/85">{f.good_for}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted">
                  trade-off
                </dt>
                <dd className="text-foreground/85">{f.trade_off}</dd>
              </div>
            </dl>
            <pre className="overflow-x-auto whitespace-pre border border-rule bg-background p-2 font-mono text-[11px] leading-snug text-foreground/85">
              {f.snippet}
            </pre>
          </div>
        ))}
      </div>

      <ExplainerBlock
        title="Pick the smallest thing that fits"
        body="Almost every production agent started life as the raw-while-loop version. Reach for a framework only when you actually feel the pain it solves: tracing across many tool calls, durable resumes across crashes, or coordinating five role-based agents. A small custom loop is usually cheaper to debug than a heavy framework you only half understand."
      />
    </div>
  );
}
