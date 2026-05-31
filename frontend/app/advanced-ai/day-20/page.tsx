'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ModelSwitcher from '../../components/ModelSwitcher';
import { Markdown } from '../../components/Markdown';
import { useNodeProgress } from '../../components/useNodeProgress';
import DayPager from '../../components/DayPager';

const NODES = [
  { id: 'N96', label: 'Stack', title: 'Choosing Your Stack + Picker' },
  { id: 'N97', label: 'Patterns', title: 'Architecture Patterns' },
  { id: 'N98', label: 'RAG E2E', title: 'Build a RAG App End-to-End' },
  { id: 'N99', label: 'Flywheel', title: 'Eval, Iterate, Improve' },
  { id: 'N100', label: 'Next', title: 'What Comes Next' },
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

export default function Day20Page() {
  const [activeId, setActiveId] = useState('N96');
  const [provider, setProvider] = useState('openai');
  const progress = useNodeProgress(20);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 20 · Capstone — Build Your AI App
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
          Twenty days. <span className="text-accent">One hundred nodes</span>.
          One shippable app.
        </h1>
        <p className="text-sm text-muted">
          Pick a stack, pick an architecture, build it end-to-end, eval it,
          and ship it. The five-toggle stack picker turns the previous 19
          days into a concrete recommendation. N96&ndash;N100.
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

      <div className={activeId === 'N96' ? undefined : 'hidden'}>
        <NodeStack provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N97' ? undefined : 'hidden'}>
        <NodePatterns provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N98' ? undefined : 'hidden'}>
        <NodeRAGEndToEnd provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N99' ? undefined : 'hidden'}>
        <NodeFlywheel provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N100' ? undefined : 'hidden'}>
        <NodeWhatNext provider={provider} setProvider={setProvider} />
      </div>

      <CompletionBanner progress={progress.dayProgress} />

      <DayPager day={20} advanced />
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
      const r = await fetch(`${API}/day20/ask`, {
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

// ─── N96 — Choosing your stack + Picker ──────────────────────────

function NodeStack({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Choosing Your Stack"
        hint="Five yes/no questions are enough to pick your stack for v1. Toggle the requirements you actually have, hit pick, and the model returns a concrete architecture + frontend + backend + vector DB + LLM provider + local runtime — with the days you should revisit before you start."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Bias toward boring"
          body="Next.js + FastAPI + a managed LLM provider beats clever new frameworks for v1. You can swap pieces later once the product works. Boring stacks ship; clever stacks demo."
          color={VIZ.green}
        />
        <FactCard
          tag="Five questions, not fifty"
          body="Multimodal? Own docs? Agents? Local? Scale? Each yes adds one architectural axis. Most v1s are simple chains; the stack picker tells you when you actually need more."
          color={VIZ.green}
        />
        <FactCard
          tag="Local is opt-in"
          body="Don't default to local inference. Cloud is faster to iterate and 95% of v1s never see the latency / cost / privacy floor that makes local actually worth it."
          color={VIZ.green}
        />
        <FactCard
          tag="Revisit before you build"
          body="The picker tells you which days to re-read first. Most build failures are skipped concepts, not bad code — re-reading Day 8 before building RAG saves a week."
          color={VIZ.green}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.green}
        presets={[
          'How do I pick between Qdrant, ChromaDB, and Pinecone for my first RAG app?',
          'Should my first AI app use an agent framework or just plain function calls?',
          'When is local inference actually worth the complexity?',
        ]}
        defaultQuestion="What stack should I default to for my first AI app?"
      />

      <StackPickerForm provider={provider} setProvider={setProvider} />

      <ExplainerBlock
        title="The point of a picker"
        body="The hard part of the capstone isn&apos;t writing the code &mdash; it&apos;s avoiding the three-week detour into &ldquo;but should I use LangGraph?&rdquo; before you&apos;ve written a single line. The picker forces a decision in 90 seconds and gives you the days to revisit. After you ship v1, the right next step is almost always &ldquo;swap one piece&rdquo; (Pinecone → Qdrant, OpenAI → Groq), not &ldquo;rewrite the architecture&rdquo;."
      />
    </div>
  );
}

type StackPickerResponse = {
  inputs: {
    needs_multimodal: boolean;
    needs_own_docs: boolean;
    needs_agents: boolean;
    needs_local: boolean;
    needs_scale: boolean;
  };
  architecture: 'simple' | 'rag' | 'agent';
  frontend: string;
  backend: string;
  vector_db: string | null;
  llm_provider: string;
  local_runtime: string | null;
  reason: string;
  days_to_revisit: number[];
  estimated_complexity: 'weekend' | '1-week' | '1-month';
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

const REQUIREMENTS: { key: keyof StackPickerResponse['inputs']; icon: string; label: string; hint: string }[] = [
  { key: 'needs_multimodal', icon: '📷', label: 'Needs multimodal', hint: 'image / audio / video in or out' },
  { key: 'needs_own_docs', icon: '📄', label: 'Needs my own docs', hint: 'RAG over user-provided content' },
  { key: 'needs_agents', icon: '🤖', label: 'Needs agents', hint: 'tool use + multi-step reasoning' },
  { key: 'needs_local', icon: '🏠', label: 'Needs to run locally', hint: 'no cloud LLM dependency' },
  { key: 'needs_scale', icon: '📈', label: 'Needs to scale', hint: 'production traffic + multi-tenant' },
];

const ARCH_COLOR: Record<'simple' | 'rag' | 'agent', string> = {
  simple: VIZ.blue,
  rag: VIZ.violet,
  agent: VIZ.amber,
};

const COMPLEXITY_COLOR: Record<'weekend' | '1-week' | '1-month', string> = {
  weekend: VIZ.green,
  '1-week': VIZ.amber,
  '1-month': VIZ.red,
};

function StackPickerForm({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  const [flags, setFlags] = useState({
    needs_multimodal: false,
    needs_own_docs: true,
    needs_agents: false,
    needs_local: false,
    needs_scale: false,
  });
  const [result, setResult] = useState<StackPickerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: keyof typeof flags) =>
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day20/stack-picker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...flags, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as StackPickerResponse);
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
          The five-question stack picker
        </h3>
        <p className="text-sm text-muted">
          Toggle what you actually need. The model recommends a stack and
          tells you which days to revisit first.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          setProvider={setProvider}
          disabled={loading}
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {REQUIREMENTS.map((r) => {
            const on = flags[r.key];
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => toggle(r.key)}
                disabled={loading}
                aria-pressed={on}
                className={[
                  'flex flex-col items-start gap-1 border p-3 text-left transition disabled:opacity-40',
                  on
                    ? 'border-accent bg-accent text-background'
                    : 'border-rule text-foreground/80 hover:border-foreground',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[16px]" aria-hidden>
                    {r.icon}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wide">
                    {on ? '✓ on' : '○ off'}
                  </span>
                </div>
                <div className="font-serif text-[14px] font-semibold">
                  {r.label}
                </div>
                <div
                  className={[
                    'font-mono text-[9px] uppercase tracking-[0.12em]',
                    on ? 'text-background/80' : 'text-muted',
                  ].join(' ')}
                >
                  {r.hint}
                </div>
              </button>
            );
          })}
        </div>

        <SubmitButton
          loading={loading}
          idle="Pick my stack →"
          busy="Recommending…"
          disabled={loading}
        />
      </form>

      {error && <ErrorBox message={error} />}
      {result && <StackPickerResult result={result} />}
    </div>
  );
}

function StackPickerResult({ result }: { result: StackPickerResponse }) {
  const archColor = ARCH_COLOR[result.architecture];
  const compColor = COMPLEXITY_COLOR[result.estimated_complexity];
  return (
    <div className="space-y-4">
      <div
        className="border bg-paper p-4 space-y-3"
        style={{ borderTop: `2px solid ${archColor}` }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="border px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em]"
            style={{
              borderColor: archColor,
              color: archColor,
              background: `${archColor}1F`,
            }}
          >
            {result.architecture} architecture
          </span>
          <span
            className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
            style={{
              borderColor: compColor,
              color: compColor,
              background: `${compColor}1F`,
            }}
          >
            {result.estimated_complexity} build
          </span>
        </div>
        <StackTable result={result} />
        {result.reason && (
          <p className="text-sm leading-relaxed text-foreground/85">
            {result.reason}
          </p>
        )}
        <Footer>
          {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
          {result.latency_ms}ms
        </Footer>
      </div>

      {result.days_to_revisit.length > 0 && (
        <div className="border border-rule bg-paper p-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Revisit these days before you start
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.days_to_revisit.map((d) => (
              <Link
                key={d}
                href={dayHref(d)}
                className="border border-accent/60 bg-accent/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-accent transition hover:bg-accent hover:text-background"
              >
                Day {String(d).padStart(2, '0')}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function dayHref(day: number): string {
  if (day <= 10) return `/day-${String(day).padStart(2, '0')}`;
  return `/advanced-ai/day-${day}`;
}

const STACK_BADGE_COLOR = [VIZ.blue, VIZ.green, VIZ.violet, VIZ.amber, VIZ.coral];

function StackTable({ result }: { result: StackPickerResponse }) {
  const rows: { label: string; value: string | null }[] = [
    { label: 'Frontend', value: result.frontend },
    { label: 'Backend', value: result.backend },
    { label: 'Vector DB', value: result.vector_db },
    { label: 'LLM Provider', value: result.llm_provider },
    { label: 'Local Runtime', value: result.local_runtime },
  ];
  return (
    <div className="border border-rule bg-background">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={[
            'grid grid-cols-[10rem_1fr] items-center gap-3 px-3 py-2 text-[12px]',
            i < rows.length - 1 ? 'border-b border-rule' : '',
          ].join(' ')}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {row.label}
          </span>
          {row.value ? (
            <span
              className="w-fit border px-2 py-0.5 font-mono text-[11px]"
              style={{
                borderColor: STACK_BADGE_COLOR[i % STACK_BADGE_COLOR.length],
                color: STACK_BADGE_COLOR[i % STACK_BADGE_COLOR.length],
                background: `${STACK_BADGE_COLOR[i % STACK_BADGE_COLOR.length]}1F`,
              }}
            >
              {row.value}
            </span>
          ) : (
            <span className="font-mono text-[11px] text-muted">— not needed</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── N97 — Architecture patterns (Simple / RAG / Agent) ──────────

function NodePatterns({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Architecture Patterns"
        hint="Three shapes cover 90% of AI apps. Simple = one LLM call. RAG = retrieve, then LLM. Agent = a loop where the model picks tools. The picker above tells you which one you need; this tab tells you what each one looks like."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        <FactCard
          tag="Simple"
          body="One prompt, one model call, one parser. Chat apps, summarizers, classifiers. The shortest path to a working v1 and the right default until you actually need more."
          color={VIZ.blue}
        />
        <FactCard
          tag="RAG"
          body="Embed the query, retrieve top-k from your vector DB, stuff into the prompt, generate. Document Q&A, support bots, codebase chat. Adds latency + cost; adds &ldquo;your data&rdquo;."
          color={VIZ.violet}
        />
        <FactCard
          tag="Agent"
          body="Loop: model thinks, picks a tool, sees the result, thinks again. Browse-the-web, code interpreter, multi-step planning. 3-10x more tokens than the equivalent chain."
          color={VIZ.amber}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.violet}
        presets={[
          'When is a simple chain enough vs RAG?',
          'When does an agent loop earn the 5x token cost?',
          'Can I start with simple and migrate to RAG later?',
        ]}
        defaultQuestion="Which architecture should I default to for a beginner AI project?"
      />

      <PatternsRow />

      <ExplainerBlock
        title="Match the architecture to the question shape"
        body="If the user asks a self-contained question that the model already knows the answer to &mdash; simple chain. If the answer is in documents the user owns &mdash; RAG. If the answer requires looking things up, computing, and chaining decisions &mdash; agent. Most teams over-architect their v1: building an agent when a chain works, building RAG when a system prompt covers it. Start with the simplest shape that satisfies the question and step up only when the simpler one demonstrably fails."
      />
    </div>
  );
}

const PATTERNS: {
  id: 'simple' | 'rag' | 'agent';
  title: string;
  color: string;
  nodes: string[];
  useCases: string[];
  tradeoff: string;
}[] = [
  {
    id: 'simple',
    title: 'Simple chain',
    color: VIZ.blue,
    nodes: ['User', 'LLM', 'Output'],
    useCases: [
      'Chat assistants on public knowledge',
      'Summarizers, classifiers, rewriters',
      'Translation and tone-shift apps',
    ],
    tradeoff: 'Cheapest + fastest · no &ldquo;your data&rdquo; · no tool use.',
  },
  {
    id: 'rag',
    title: 'RAG',
    color: VIZ.violet,
    nodes: ['User', 'Embed', 'Retrieve', 'LLM + ctx', 'Output'],
    useCases: [
      'Document Q&A · customer support',
      'Codebase chat · internal knowledge bots',
      'Citation-rich answer engines (Perplexity)',
    ],
    tradeoff: '~2x latency · vector DB to run · grounds answers in your docs.',
  },
  {
    id: 'agent',
    title: 'Agent loop',
    color: VIZ.amber,
    nodes: ['User', 'Agent', 'Tool', '(loop)', 'Output'],
    useCases: [
      'Browse-the-web research assistants',
      'Code interpreter / data-analysis bots',
      'Multi-step ops automations',
    ],
    tradeoff: '3-10x tokens · debug-heavy · handles open-ended tasks.',
  },
];

function PatternsRow() {
  const [selected, setSelected] = useState<'simple' | 'rag' | 'agent'>('rag');
  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Three diagrams, three trade-offs
        </h3>
        <p className="text-sm text-muted">
          Click any pattern to see use cases and what it costs you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {PATTERNS.map((p) => (
          <PatternCard
            key={p.id}
            pattern={p}
            active={p.id === selected}
            onClick={() => setSelected(p.id)}
          />
        ))}
      </div>

      <PatternDetail
        pattern={PATTERNS.find((p) => p.id === selected) ?? PATTERNS[0]}
      />
    </div>
  );
}

function PatternCard({
  pattern,
  active,
  onClick,
}: {
  pattern: (typeof PATTERNS)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="border bg-paper p-3 text-left transition"
      style={{
        borderTop: `2px solid ${pattern.color}`,
        background: active ? `${pattern.color}10` : undefined,
        boxShadow: active ? `0 0 0 2px ${pattern.color}66` : 'none',
      }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: pattern.color }}
      >
        {pattern.title}
      </div>
      <div className="mt-3">
        <PatternDiagram pattern={pattern} />
      </div>
    </button>
  );
}

function PatternDiagram({
  pattern,
}: {
  pattern: (typeof PATTERNS)[number];
}) {
  const nodes = pattern.nodes;
  return (
    <div className="space-y-1.5">
      {nodes.map((n, i) => (
        <div key={i} className="space-y-1">
          <div
            className="border bg-background px-2 py-1 text-center font-mono text-[10px]"
            style={{ borderLeft: `2px solid ${pattern.color}` }}
          >
            {n}
          </div>
          {i < nodes.length - 1 && (
            <div className="text-center font-mono text-[10px] text-muted">
              {pattern.id === 'agent' && i === nodes.length - 2 ? '↻' : '↓'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PatternDetail({
  pattern,
}: {
  pattern: (typeof PATTERNS)[number];
}) {
  return (
    <div
      className="border bg-paper p-4 space-y-3"
      style={{ borderLeft: `3px solid ${pattern.color}` }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: pattern.color }}
      >
        {pattern.title}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Use cases
          </div>
          <ul className="mt-1 space-y-1 text-[12px] text-foreground/85">
            {pattern.useCases.map((u, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted" aria-hidden>
                  •
                </span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Trade-off
          </div>
          <p
            className="mt-1 text-[12px] text-foreground/85"
            dangerouslySetInnerHTML={{ __html: pattern.tradeoff }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── N98 — RAG end-to-end with animated dot ──────────────────────

function NodeRAGEndToEnd({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Build a RAG App End-to-End"
        hint="Every box in the diagram below maps to a day you already covered. Day 6 builds the embedder. Day 7 holds the vectors. Day 8 builds the retriever + prompt. Day 15 wraps it in evals. The capstone is wiring them together with a UI."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Stream the answer"
          body="Run the LLM with streaming. The first token in 600ms beats a perfectly-formatted answer in 6 seconds for perceived latency. SSE or fetch streams on the API side."
          color={VIZ.violet}
        />
        <FactCard
          tag="Cite the source"
          body="Return chunk IDs alongside the answer so the UI can render citations. Costs little; pays for itself the first time a user asks 'how do you know that?'."
          color={VIZ.violet}
        />
        <FactCard
          tag="Cache the embed"
          body="Same query → same embedding. Cache the query embeddings for ~24h; you'll cut embedding cost by half on a chat app where users rephrase."
          color={VIZ.violet}
        />
        <FactCard
          tag="Ship before reranking"
          body="Rerankers (BGE / Cohere) add quality but also latency + cost + a vendor. Ship without one. Add only after eval (Day 15) shows retrieval is your biggest miss."
          color={VIZ.violet}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.violet}
        presets={[
          'What is the minimum viable RAG pipeline I can build in a weekend?',
          'How do I implement streaming for a RAG app in FastAPI?',
          'When should I add a reranker?',
        ]}
        defaultQuestion="What does a real RAG app look like end-to-end?"
      />

      <RAGPipelineVisual />

      <ExplainerBlock
        title="The whole roadmap in one diagram"
        body="Walk the dot through the pipeline below and you&apos;ll touch nine of the twenty days. PDF parsing is Day 5; chunking strategy is Day 6; embeddings are Day 6; Qdrant is Day 7; retrieval is Day 8; prompt construction is Day 3 + 4; the LLM call is Day 1; streaming is Day 17; the eval at the end is Day 15. v1 doesn&apos;t need to nail any of them &mdash; it needs to wire them together end-to-end. Polish each piece in iteration."
      />
    </div>
  );
}

const RAG_STAGES: { name: string; tag: string; color: string }[] = [
  { name: 'PDF upload', tag: 'Day 5', color: VIZ.coral },
  { name: 'Chunker', tag: 'Day 6', color: VIZ.coral },
  { name: 'Embedder', tag: 'Day 6', color: VIZ.coral },
  { name: 'Qdrant', tag: 'Day 7', color: VIZ.violet },
  { name: 'Retriever', tag: 'Day 8', color: VIZ.violet },
  { name: 'Prompt builder', tag: 'Day 3', color: VIZ.blue },
  { name: 'LLM', tag: 'Day 1', color: VIZ.blue },
  { name: 'Streaming response', tag: 'Day 17', color: VIZ.amber },
  { name: 'UI', tag: 'Day 20', color: VIZ.green },
];

function RAGPipelineVisual() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);

  const start = () => {
    setRunning(true);
    setStep(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= RAG_STAGES.length) {
        clearInterval(id);
        setTimeout(() => {
          setRunning(false);
          setStep(-1);
        }, 800);
      } else {
        setStep(i);
      }
    }, 500);
  };

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">
            One question, nine boxes
          </h3>
          <p className="text-sm text-muted">
            Tap run demo to walk a query through the full pipeline. Active
            box lights up; visited boxes stay tinted.
          </p>
        </div>
        <button
          onClick={start}
          disabled={running}
          className="border border-foreground bg-foreground px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
        >
          {running ? 'running…' : 'run demo →'}
        </button>
      </div>

      <div className="border border-rule bg-paper p-4">
        <ol className="grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-5">
          {RAG_STAGES.map((s, i) => {
            const active = step === i;
            const visited = step >= 0 && i <= step;
            return (
              <li key={i}>
                <div
                  className="space-y-1 border bg-background p-2 transition"
                  style={{
                    borderTop: `2px solid ${s.color}`,
                    background: active
                      ? `${s.color}26`
                      : visited
                        ? `${s.color}10`
                        : 'transparent',
                    boxShadow: active ? `0 0 0 2px ${s.color}66` : 'none',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: s.color }}
                    >
                      step {i + 1}
                    </span>
                    <span className="font-mono text-[9px] text-muted">
                      {s.tag}
                    </span>
                  </div>
                  <div className="font-serif text-[13px] font-semibold">
                    {s.name}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

// ─── N99 — Eval flywheel ─────────────────────────────────────────

function NodeFlywheel({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Eval, Iterate, Improve"
        hint="The flywheel that keeps AI apps from regressing. Log every trace; tag the bad ones; pull them into a dataset; run evals against that dataset on every change; ship when green; repeat. The compounding habit that separates teams who improve from teams who stagnate."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Log everything"
          body="Every prompt, every retrieval, every response. Storage is cheap; the trace you don't capture is the one you can't debug. Langfuse + LangSmith both make this one-line."
          color={VIZ.blue}
        />
        <FactCard
          tag="Tag the bad ones"
          body="In-product thumbs-up / thumbs-down + a hidden 'flag for review' that funnels into your dataset. The bad traces become the eval signal."
          color={VIZ.amber}
        />
        <FactCard
          tag="Eval on every change"
          body="Wire RAGAS or a custom scorer into CI. Every PR that changes a prompt runs the dataset; you see the delta before merging. Catches the silent regressions."
          color={VIZ.coral}
        />
        <FactCard
          tag="Ship, then repeat"
          body="The flywheel only spins when you actually ship the change and start logging again. Teams that build the flywheel and never push compete on the same ground as teams that don't have one."
          color={VIZ.green}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.coral}
        presets={[
          'How do I bootstrap a 100-row eval dataset for a brand new RAG app?',
          'What does &lsquo;log everything&rsquo; mean in practice for cost-sensitive apps?',
          'How often should I re-run the eval set?',
        ]}
        defaultQuestion="How do I build the iterate-on-feedback flywheel for an AI app?"
      />

      <FlywheelVisual />

      <ExplainerBlock
        title="The habit that compounds"
        body="The flywheel doesn&apos;t reward heroics &mdash; it rewards consistency. A team that lands one improvement per week from real traces beats a team that ships one giant refactor per quarter, every time. Build the logging + tagging + dataset + eval loop in week one, even ugly. Polish the tooling later. The most important property of the flywheel is that it spins, not that any individual stage is perfect."
      />
    </div>
  );
}

const FLYWHEEL_STAGES: { name: string; tool: string; color: string; angle: number }[] = [
  { name: 'Log', tool: 'Langfuse / LangSmith', color: VIZ.blue, angle: -90 },
  { name: 'Tag', tool: 'Thumbs + flag-for-review', color: VIZ.amber, angle: -18 },
  { name: 'Dataset', tool: 'Curated trace bundle', color: VIZ.violet, angle: 54 },
  { name: 'Eval', tool: 'RAGAS / custom scorer', color: VIZ.coral, angle: 126 },
  { name: 'Ship', tool: 'CI gate · canary roll', color: VIZ.green, angle: 198 },
];

function FlywheelVisual() {
  const [selected, setSelected] = useState(0);
  const cx = 50;
  const cy = 50;
  const r = 36;

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The improvement flywheel
        </h3>
        <p className="text-sm text-muted">
          Click any stage to see the tool example. Five stages; arrows go
          clockwise; the wheel only matters if it keeps spinning.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 border border-rule bg-paper p-4 md:grid-cols-[2fr_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <defs>
              <marker
                id="fw-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={VIZ.grey} />
              </marker>
            </defs>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={VIZ.grey}
              strokeWidth="0.4"
              strokeDasharray="2 2"
            />
            {/* clockwise arrow arcs between adjacent stages */}
            {FLYWHEEL_STAGES.map((_, i) => {
              const a1 = (FLYWHEEL_STAGES[i].angle * Math.PI) / 180;
              const next = FLYWHEEL_STAGES[(i + 1) % FLYWHEEL_STAGES.length];
              const a2 = (next.angle * Math.PI) / 180;
              const x1 = cx + (r - 4) * Math.cos(a1);
              const y1 = cy + (r - 4) * Math.sin(a1);
              const x2 = cx + (r - 4) * Math.cos(a2);
              const y2 = cy + (r - 4) * Math.sin(a2);
              return (
                <path
                  key={i}
                  d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r - 4} ${r - 4} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
                  fill="none"
                  stroke={VIZ.grey}
                  strokeWidth="0.5"
                  markerEnd="url(#fw-arrow)"
                />
              );
            })}
          </svg>

          {FLYWHEEL_STAGES.map((s, i) => {
            const a = (s.angle * Math.PI) / 180;
            const x = cx + r * Math.cos(a);
            const y = cy + r * Math.sin(a);
            const active = i === selected;
            return (
              <button
                key={s.name}
                onClick={() => setSelected(i)}
                aria-pressed={active}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
              >
                <span
                  className="border bg-background px-2 py-1 font-mono text-[11px] uppercase tracking-wide transition"
                  style={{
                    borderColor: s.color,
                    color: s.color,
                    background: active ? `${s.color}26` : `${s.color}0F`,
                    boxShadow: active
                      ? `0 0 0 2px ${s.color}66`
                      : 'none',
                  }}
                >
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="border bg-paper p-3 space-y-2"
          style={{
            borderLeft: `3px solid ${FLYWHEEL_STAGES[selected].color}`,
          }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: FLYWHEEL_STAGES[selected].color }}
          >
            {FLYWHEEL_STAGES[selected].name}
          </div>
          <p className="font-mono text-[11px] text-foreground/85">
            {FLYWHEEL_STAGES[selected].tool}
          </p>
          <p className="text-[12px] leading-snug text-foreground/80">
            {FLYWHEEL_DESCRIPTIONS[FLYWHEEL_STAGES[selected].name]}
          </p>
        </div>
      </div>
    </div>
  );
}

const FLYWHEEL_DESCRIPTIONS: Record<string, string> = {
  Log: 'Capture every prompt, retrieval, and response into one place. Storage is cheap; uncaught traces become invisible regressions.',
  Tag: 'In-app thumbs + a hidden flag for review feed bad cases into the dataset. The bad traces are the signal.',
  Dataset: 'A curated bundle of (input, expected behavior) tuples. Grows with every flagged trace; never shrinks.',
  Eval: 'RAGAS or a custom scorer runs against the dataset on every change. Catches silent regressions before merge.',
  Ship: 'CI gate + canary roll. The flywheel only spins if the change actually goes out.',
};

// ─── N100 — What comes next + Constellation map ──────────────────

function NodeWhatNext({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="What Comes Next"
        hint="A hundred nodes in. The roadmap stops here; the work doesn't. The constellation below is a map of everything you covered, color-coded by track. The path forward is to actually ship something, not to add more nodes."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Ship the v1"
          body="A working v1 in a public repo beats a perfect v3 in your head every single time. The capstone is not done until the URL is in your README."
          color={VIZ.green}
        />
        <FactCard
          tag="Watch one cohort"
          body="Pick a HuggingFace org, a research group, or a single open-source maintainer and follow their releases for 12 months. Depth in one corner beats shallow takes across the field."
          color={VIZ.blue}
        />
        <FactCard
          tag="Read the bad answers"
          body="Open Langfuse / LangSmith every week and read the lowest-scored traces. Most product wins come from there, not from the next model release."
          color={VIZ.amber}
        />
        <FactCard
          tag="Teach someone else"
          body="Pair-program with a friend who hasn't done this roadmap and rebuild Day 1. The act of explaining is what locks the knowledge in."
          color={VIZ.coral}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.green}
        presets={[
          'What is the smallest AI side project I could ship this weekend?',
          'How do I keep up with AI as a working engineer in 2026?',
          'What advanced topic should I dive into after this roadmap?',
        ]}
        defaultQuestion="What should I build first after finishing this roadmap?"
      />

      <ConstellationMap />

      <ExplainerBlock
        title="The map is not the territory"
        body="The roadmap covers the surface of every track &mdash; foundations, retrieval, agents, infra, advanced. That breadth is the starting condition, not the destination. The next year is about going deep on the corner that matters for the product you build. The teams that stay shallow stay junior; the ones that pick one workflow and master it end up with the case studies on Day 19."
      />
    </div>
  );
}

// 100 nodes laid out in 5 horizontal rows, one per category color.
// The roadmap groups some node ranges with the same color even though they
// belong to non-adjacent days (e.g. agents = N41-N50 + N76-N80). We draw a
// small gap between non-adjacent ranges so the structure is visible.
type NodeMapEntry = {
  id: number;
  color: string;
  category: string;
  day: number;
  label: string;
};

function buildConstellation(): { rows: NodeMapEntry[][] } {
  const labels: Record<number, string> = {
    1: 'What is an LLM?',
    2: 'Tokens',
    3: 'Embeddings intro',
    4: 'Vector space intuition',
    5: 'Model families',
    6: 'Temperature',
    7: 'System prompts',
    8: 'Few-shot',
    9: 'Chain of thought',
    10: 'JSON mode',
    11: 'Prompt engineering',
    12: 'Self-consistency',
    13: 'Tree of thoughts',
    14: 'Tool use',
    15: 'Structured output',
    16: 'Model selection',
    17: 'Provider switching',
    18: 'Closed vs open',
    19: 'Frontier models',
    20: 'Model benchmarks',
    21: 'Embeddings deep dive',
    22: 'Cosine similarity',
    23: 'Embedding models',
    24: 'Dimensionality',
    25: 'Chunking',
    26: 'pgvector',
    27: 'In-memory vectors',
    28: 'Filtering',
    29: 'Top-k retrieval',
    30: 'Hybrid search',
    31: 'RAG basics',
    32: 'Document ingestion',
    33: 'Reranking',
    34: 'Citation',
    35: 'Multimodal RAG',
    36: 'Naive vs advanced RAG',
    37: 'Eval RAG',
    38: 'Cache strategies',
    39: 'RAG failure modes',
    40: 'RAG production',
    41: 'Agents intro',
    42: 'ReAct loop',
    43: 'Tool definitions',
    44: 'Multi-step agents',
    45: 'Planning',
    46: 'MCP',
    47: 'Safety guardrails',
    48: 'Multimodal in',
    49: 'Multimodal out',
    50: 'Image generation',
    51: 'FAISS',
    52: 'ChromaDB',
    53: 'Qdrant',
    54: 'Weaviate',
    55: 'Pinecone',
    56: 'PyTorch',
    57: 'TensorFlow',
    58: 'HuggingFace Hub',
    59: 'Transformers',
    60: 'ONNX',
    61: 'AWS Bedrock',
    62: 'GCP Vertex',
    63: 'Azure OpenAI',
    64: 'Alibaba DashScope',
    65: 'Kaggle + Colab',
    66: 'Ollama',
    67: 'vLLM',
    68: 'TGI',
    69: 'llama.cpp',
    70: 'LM Studio',
    71: 'LangSmith',
    72: 'Langfuse',
    73: 'RAGAS',
    74: 'Weave (W&B)',
    75: 'OpenTelemetry',
    76: 'LangChain LCEL',
    77: 'LangChain Agents',
    78: 'LlamaIndex',
    79: 'LangGraph',
    80: 'CrewAI',
    81: 'Docker',
    82: 'CI/CD',
    83: 'Cost optimization',
    84: 'Monitoring',
    85: 'Blue/green',
    86: 'LoRA / QLoRA',
    87: 'RLHF',
    88: 'DPO',
    89: 'Alignment',
    90: 'Quantization',
    91: 'Pricing',
    92: 'GTM',
    93: 'Demo trap',
    94: 'Responsible AI',
    95: 'Case studies',
    96: 'Stack picker',
    97: 'Patterns',
    98: 'RAG E2E',
    99: 'Flywheel',
    100: 'What comes next',
  };

  const dayOf = (n: number): number => {
    if (n <= 5) return 1;
    if (n <= 10) return 2;
    if (n <= 15) return 3;
    if (n <= 20) return 4;
    if (n <= 25) return 5;
    if (n <= 30) return 6;
    if (n <= 35) return 7;
    if (n <= 40) return 8;
    if (n <= 45) return 9;
    if (n <= 50) return 10;
    return 10 + Math.ceil((n - 50) / 5);
  };

  // Group definitions per the roadmap spec.
  const FOUNDATIONS = range(1, 20);
  const RETRIEVAL = range(21, 40);
  const AGENTS = [...range(41, 50), ...range(76, 80)];
  const INFRA = [...range(51, 70), ...range(81, 85)];
  const ADVANCED = [...range(71, 75), ...range(86, 100)];

  const mk = (ids: number[], color: string, category: string): NodeMapEntry[] =>
    ids.map((id) => ({
      id,
      color,
      category,
      day: dayOf(id),
      label: labels[id] ?? `Node ${id}`,
    }));

  return {
    rows: [
      mk(FOUNDATIONS, VIZ.teal, 'foundations'),
      mk(RETRIEVAL, VIZ.coral, 'retrieval'),
      mk(AGENTS, VIZ.violet, 'agents'),
      mk(INFRA, VIZ.amber, 'infra'),
      mk(ADVANCED, VIZ.blue, 'advanced'),
    ],
  };
}

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

function ConstellationMap() {
  const [data] = useState(buildConstellation);
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<NodeMapEntry | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Build cumulative delay so the wave sweeps across all 100 in ~3s.
  let cursor = 0;
  const delays: Map<number, number> = new Map();
  for (const row of data.rows) {
    for (const node of row) {
      delays.set(node.id, cursor * 30);
      cursor += 1;
    }
  }

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">
            All 100 nodes
          </h3>
          <p className="text-sm text-muted">
            Each dot is one node, colored by category. Hover for the name +
            day. The map lights up on mount; N100 flashes white at the end.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { color: VIZ.teal, label: 'foundations' },
            { color: VIZ.coral, label: 'retrieval' },
            { color: VIZ.violet, label: 'agents' },
            { color: VIZ.amber, label: 'infra' },
            { color: VIZ.blue, label: 'advanced' },
          ].map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: l.color }}
              />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3 border border-rule bg-paper p-4">
        <div className="space-y-2.5">
          {data.rows.map((row, ri) => (
            <div key={ri} className="flex flex-wrap items-center gap-1.5">
              <span
                className="w-24 shrink-0 font-mono text-[9px] uppercase tracking-[0.18em]"
                style={{ color: row[0]?.color ?? VIZ.grey }}
              >
                {row[0]?.category}
              </span>
              <div className="flex flex-1 flex-wrap gap-1">
                {row.map((node) => {
                  const isHundredth = node.id === 100;
                  const delay = delays.get(node.id) ?? 0;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onMouseEnter={() => setHovered(node)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(node)}
                      onBlur={() => setHovered(null)}
                      className="relative h-3 w-3 transition"
                      aria-label={`N${node.id} ${node.label}`}
                      style={{
                        borderRadius: '9999px',
                        background: mounted ? node.color : VIZ.grey,
                        opacity: mounted ? 1 : 0.25,
                        transition: `background 240ms ease-out ${delay}ms, opacity 240ms ease-out ${delay}ms`,
                        boxShadow:
                          isHundredth && mounted
                            ? `0 0 8px 2px ${node.color}, 0 0 0 2px white`
                            : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-rule pt-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {hovered
              ? `N${hovered.id} · ${hovered.label} · Day ${hovered.day}`
              : 'hover a dot for details'}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            100 / 100
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Completion banner (always visible at bottom) ────────────────

function CompletionBanner({
  progress,
}: {
  progress: { done: number; total: number } | null;
}) {
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 5;
  const allDone = progress !== null && done >= total;
  return (
    <section
      className="space-y-3 border bg-paper p-6"
      style={{
        borderTop: `3px solid ${allDone ? VIZ.green : 'var(--accent)'}`,
        background: allDone ? `${VIZ.green}10` : 'var(--paper)',
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-3xl font-semibold">
          {allDone ? '✓ Roadmap complete' : 'Almost there.'}
        </h2>
        {progress && (
          <span
            className={[
              'font-mono text-[11px] uppercase tracking-[0.18em]',
              allDone ? '' : 'text-accent',
            ].join(' ')}
            style={allDone ? { color: VIZ.green } : undefined}
          >
            {done} / {total} Day 20 nodes
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-foreground/85">
        Tokens, embeddings, prompts, models, vector DBs, RAG, agents, MCP,
        multimodal, observability, frameworks, deployment, fine-tuning,
        alignment, quantization, business. You built every one. Now go
        ship something.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {[
          {
            href: 'https://huggingface.co/models',
            label: 'HuggingFace Hub',
            color: VIZ.amber,
          },
          {
            href: 'https://github.com/openclaw/openclaw',
            label: 'OpenClaw',
            color: VIZ.violet,
          },
          {
            href: 'https://www.anthropic.com/research',
            label: 'Anthropic Research',
            color: VIZ.coral,
          },
          {
            href: 'https://simonwillison.net/',
            label: "Simon Willison's Blog",
            color: VIZ.blue,
          },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="border px-3 py-1 font-mono text-[11px] uppercase tracking-wide transition hover:bg-foreground hover:text-background"
            style={{
              borderColor: link.color,
              color: link.color,
              background: `${link.color}10`,
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
