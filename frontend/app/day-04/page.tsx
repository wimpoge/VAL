'use client';

import { useEffect, useRef, useState } from 'react';
import ModelSwitcher from '../components/ModelSwitcher';
import { useNodeProgress } from '../components/useNodeProgress';

const NODES = [
  { id: 'N16', label: 'Structured', title: 'Structured output' },
  { id: 'N17', label: 'System', title: 'System prompting' },
  { id: 'N18', label: 'Role', title: 'Role & behavior control' },
  { id: 'N19', label: 'ReAct', title: 'ReAct — reason + act' },
  { id: 'N20', label: 'Temperature', title: 'Sampling / temperature' },
];

const VIZ = {
  green: '#1D9E75',
  blue: '#378ADD',
  violet: '#7F77DD',
  amber: '#FAC775',
  coral: '#F5C4B3',
} as const;

export default function Day04Page() {
  const [activeId, setActiveId] = useState('N16');
  const progress = useNodeProgress(4);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 04 · Prompt Engineering Advanced
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
          Make the model <span className="text-accent">behave</span>.
        </h1>
        <p className="text-sm text-muted">
          Structured output, system prompts, roles, ReAct, and temperature.
          Each tab is N16–N20.
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

      {activeId === 'N16' && <NodeStructured />}
      {activeId === 'N17' && <NodeSystem />}
      {activeId === 'N18' && <NodeRole />}
      {activeId === 'N19' && <NodeReact />}
      {activeId === 'N20' && <NodeTemperature />}
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

// ─── N16 — Structured output ──────────────────────────────────────

type StructuredResponse = {
  name: string;
  category: string;
  price_range: string;
  sentiment: string;
  key_features: string[];
  summary: string;
  raw: string;
  prompt_tokens: number;
  completion_tokens: number;
  provider: string;
  model: string;
};

const STRUCTURED_PRESETS = [
  'The AuroraBook Pro 14 is a premium ultralight laptop with a 14-inch OLED screen, 18-hour battery, and a fanless M-class chip. Reviewers love the build quality but say it runs hot under heavy load. Around $1,900.',
  'Cheap plastic blender, 300W motor, two speed settings. Works for smoothies but struggles with ice and the lid leaks. Roughly $25.',
  'The TrailMate 40L hiking backpack has a ventilated back panel, rain cover, and 12 pockets. Hikers say it is comfortable on long treks but the zippers feel flimsy. Mid-range price near $120.',
];

function NodeStructured() {
  const [provider, setProvider] = useState('openai');
  const [description, setDescription] = useState(STRUCTURED_PRESETS[0]);
  const [submitted, setSubmitted] = useState('');
  const [result, setResult] = useState<StructuredResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [showRaw, setShowRaw] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowRaw(false);
    setSubmitted(description);
    try {
      const r = await fetch('http://localhost:8000/day04/structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as StructuredResponse);
      setRunId((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Structured output"
        hint="Free-text in, strict JSON out. The system prompt declares a schema and response_format forces the model to fill it — no parsing prose."
      />
      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <PresetRow
          presets={STRUCTURED_PRESETS}
          onPick={setDescription}
          disabled={loading}
          labelPrefix="product"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={4}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
          placeholder="Paste a messy product description…"
        />
        <SubmitButton
          loading={loading}
          idle="Extract →"
          busy="Extracting…"
          disabled={loading || !description.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <StructuredVisualizer
          key={runId}
          result={result}
          inputText={submitted}
        />
      )}

      {result && (
        <Footer>
          {result.provider} · {result.model} · {result.prompt_tokens}+
          {result.completion_tokens} tok
        </Footer>
      )}

      {result && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:text-foreground"
          >
            {showRaw ? '▾ Hide raw output' : '▸ Show raw output'}
          </button>
          {showRaw && (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words border border-rule bg-paper p-3 font-mono text-[12px] leading-relaxed text-foreground/80">
              {result.raw}
            </pre>
          )}
        </div>
      )}

      <ExplainerBlock
        title="Why a schema beats parsing prose"
        body="Without a schema you get a paragraph you have to regex. With response_format=json_object plus a system prompt that names every key, the model returns a machine-readable object every time. The schema is a contract: the same six keys come back whether the input is a laptop or a backpack — which is exactly what downstream code needs."
      />
    </div>
  );
}

const SCHEMA_ROWS: { key: string; type: string; desc: string }[] = [
  { key: 'name', type: 'string', desc: 'product name' },
  { key: 'category', type: 'string', desc: 'product type' },
  { key: 'price_range', type: 'string', desc: 'budget / mid / premium' },
  { key: 'sentiment', type: 'string', desc: 'positive / negative / mixed' },
  { key: 'key_features', type: 'string[]', desc: 'list of features' },
  { key: 'summary', type: 'string', desc: 'one sentence summary' },
];

const SCHEMA_TEAL = '#2DD4BF';

function vizSentimentColor(s: string) {
  if (s === 'positive') return VIZ.green;
  if (s === 'negative') return '#ef4444';
  return VIZ.amber;
}

function StructuredVisualizer({
  result,
  inputText,
}: {
  result: StructuredResponse;
  inputText: string;
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const proseRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLDivElement | null>(null);
  const fieldRefs = useRef<(HTMLDivElement | null)[]>([]);
  const insightRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current = [];
    const sched = (delay: number, fn: () => void) => {
      timersRef.current.push(setTimeout(fn, delay));
    };
    const show = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    };

    sched(30, () => show(sectionRef.current));
    let t = 150;
    sched(t, () => show(proseRef.current));
    t += 400;
    sched(t, () => {
      const el = arrowRef.current;
      if (el) el.style.opacity = '1';
    });
    t += 400;
    const fieldStart = t;
    for (let i = 0; i < 6; i++) {
      const idx = i;
      sched(fieldStart + i * 280, () => show(fieldRefs.current[idx]));
    }
    const lastField = fieldStart + 5 * 280;
    sched(lastField + 400, () => show(insightRef.current));

    return () => {
      for (const id of timersRef.current) clearTimeout(id);
      timersRef.current = [];
    };
  }, []);

  const fieldHidden: React.CSSProperties = {
    opacity: 0,
    transform: 'translateY(8px)',
    transition: 'opacity 320ms ease-out, transform 320ms ease-out',
  };

  return (
    <div
      ref={sectionRef}
      className="border-t border-rule pt-6"
      style={{
        opacity: 0,
        transform: 'translateY(8px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
    >
      <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        Schema → extraction
      </div>
      <div className="grid grid-cols-[1fr_32px_1fr] gap-3">
        {/* LEFT — schema + prose input */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            JSON schema sent to model
          </div>
          <div className="border border-rule bg-paper p-3 font-mono text-[12px] leading-relaxed">
            <div className="text-muted">{'{'}</div>
            {SCHEMA_ROWS.map((row) => (
              <div
                key={row.key}
                className="flex flex-wrap items-baseline gap-x-2 pl-3"
              >
                <span style={{ color: SCHEMA_TEAL }}>&quot;{row.key}&quot;</span>
                <span
                  className="border px-1.5 py-0.5 text-[10px]"
                  style={{ borderColor: VIZ.violet, color: VIZ.violet }}
                >
                  {row.type}
                </span>
                <span className="text-[11px] text-muted">{row.desc}</span>
              </div>
            ))}
            <div className="text-muted">{'}'}</div>
          </div>

          <div
            ref={proseRef}
            style={fieldHidden}
            className="space-y-1"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Prose input
            </div>
            <div className="border border-rule bg-paper/60 p-3 text-[13px] leading-relaxed text-foreground/80">
              {inputText || '—'}
            </div>
          </div>
        </div>

        {/* CENTER — arrow */}
        <div className="flex items-center justify-center">
          <div
            ref={arrowRef}
            className="flex flex-col items-center gap-1"
            style={{ opacity: 0, transition: 'opacity 400ms ease' }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
              extract
            </span>
            <span
              className="text-lg"
              style={{ color: VIZ.green }}
              aria-hidden
            >
              →
            </span>
          </div>
        </div>

        {/* RIGHT — extracted JSON output + insight */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Extracted JSON output
          </div>
          <div className="space-y-2 border border-rule bg-paper p-3">
            <OutField
              ref={(el) => {
                fieldRefs.current[0] = el;
              }}
              style={fieldHidden}
              label="name"
            >
              <span className="font-mono text-[13px] text-foreground/90">
                {result.name}
              </span>
            </OutField>
            <OutField
              ref={(el) => {
                fieldRefs.current[1] = el;
              }}
              style={fieldHidden}
              label="category"
            >
              <span className="font-mono text-[13px] text-foreground/90">
                {result.category}
              </span>
            </OutField>
            <OutField
              ref={(el) => {
                fieldRefs.current[2] = el;
              }}
              style={fieldHidden}
              label="price_range"
            >
              <span className="font-mono text-[13px] text-foreground/90">
                {result.price_range}
              </span>
            </OutField>
            <OutField
              ref={(el) => {
                fieldRefs.current[3] = el;
              }}
              style={fieldHidden}
              label="sentiment"
            >
              <Badge
                value={result.sentiment}
                color={vizSentimentColor(result.sentiment)}
              />
            </OutField>
            <OutField
              ref={(el) => {
                fieldRefs.current[4] = el;
              }}
              style={fieldHidden}
              label="key_features"
            >
              <div className="flex flex-wrap gap-1.5">
                {result.key_features.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 font-mono text-[11px]"
                    style={{
                      color: VIZ.blue,
                      background: `${VIZ.blue}1F`,
                      border: `1px solid ${VIZ.blue}`,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </OutField>
            <OutField
              ref={(el) => {
                fieldRefs.current[5] = el;
              }}
              style={fieldHidden}
              label="summary"
            >
              <p
                className="text-[13px] text-muted"
                style={{ lineHeight: 1.5 }}
              >
                {result.summary}
              </p>
            </OutField>
          </div>

          <div
            ref={insightRef}
            className="bg-paper/40 p-3 text-[13px] leading-relaxed text-foreground/85"
            style={{
              ...fieldHidden,
              borderLeft: `2px solid ${VIZ.green}`,
              borderRadius: 8,
            }}
          >
            <span aria-hidden className="mr-1.5">
              💡
            </span>
            The schema is a contract. The same 6 keys come back every time —
            whether the input is a laptop or a backpack. Your code never needs
            to parse prose again.
          </div>
        </div>
      </div>
    </div>
  );
}

const OutField = ({
  ref,
  label,
  style,
  children,
}: {
  ref: (el: HTMLDivElement | null) => void;
  label: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}) => (
  <div ref={ref} style={style}>
    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
      {label}
    </div>
    <div className="mt-0.5">{children}</div>
  </div>
);

// ─── N17 — System prompting ───────────────────────────────────────

type SystemVariant = {
  id: string;
  label: string;
  system: string;
  note: string;
  answer: string;
  prompt_tokens: number;
  completion_tokens: number;
};
type SystemResponse = {
  results: SystemVariant[];
  question: string;
  provider: string;
  model: string;
};

const SYSTEM_PRESETS = [
  'Why is the sky blue?',
  'What is a database index?',
  'How does HTTPS keep my password safe?',
];

const VARIANT_COLOR: Record<string, string> = {
  none: '#9CA3AF',
  concise: VIZ.blue,
  eli5: VIZ.green,
};

function NodeSystem() {
  const [provider, setProvider] = useState('openai');
  const [question, setQuestion] = useState(SYSTEM_PRESETS[0]);
  const [result, setResult] = useState<SystemResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch('http://localhost:8000/day04/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as SystemResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="System prompting"
        hint="Same user question, three different system prompts. The system message is the model's standing orders — it changes the answer without changing what you asked."
      />
      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <PresetRow
          presets={SYSTEM_PRESETS}
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
          idle="Run all three →"
          busy="Running…"
          disabled={loading || !question.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="border border-rule border-l-2 border-l-accent bg-paper/40 px-3 py-2 text-sm">
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
            Identical user message
          </span>
          <div className="mt-0.5 text-foreground/90">{result.question}</div>
        </div>
      )}

      {(result || loading) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(result?.results ?? [null, null, null]).map((v, i) => {
            const color = v ? VARIANT_COLOR[v.id] ?? '#9CA3AF' : '#9CA3AF';
            return (
              <div
                key={i}
                className="space-y-2 border border-rule bg-paper p-3"
                style={{ borderTop: `2px solid ${color}` }}
              >
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color }}
                >
                  {v ? v.label : 'loading…'}
                </div>
                {v ? (
                  <>
                    <div className="border border-rule bg-paper/60 px-2 py-1.5">
                      <div className="font-mono text-[9px] uppercase tracking-wide text-muted">
                        system prompt
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] leading-snug text-foreground/75">
                        {v.system || '— (none)'}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                      {v.answer}
                    </p>
                    <Footer>
                      {v.prompt_tokens}+{v.completion_tokens} tok
                    </Footer>
                  </>
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

      {result && (
        <Footer>
          {result.provider} · {result.model} · {result.results.length} calls
        </Footer>
      )}

      <ExplainerBlock
        title="The system prompt is leverage"
        body="The user message asks the question; the system message decides how the model is allowed to answer it. Notice the question text never changed — only the standing orders did. This is the cheapest, highest-leverage control you have: no fine-tuning, no extra tokens in the user turn, just a few sentences of policy the model follows for the whole conversation."
      />
    </div>
  );
}

// ─── N18 — Role & behavior control ────────────────────────────────

type RoleSide = {
  answer: string;
  prompt_tokens: number;
  completion_tokens: number;
};
type RoleResult = {
  role_key: string;
  role_name: string;
  answer: string;
  prompt_tokens: number;
  completion_tokens: number;
};
type RoleResponse = {
  task: string;
  role: string;
  role_system: string;
  plain: RoleSide;
  roled: RoleSide;
  results: RoleResult[];
  provider: string;
  model: string;
};

const ROLE_OPTIONS = [
  { key: 'security_engineer', label: 'Security engineer' },
  { key: 'kindergarten_teacher', label: 'Kindergarten teacher' },
  { key: 'unix_manpage', label: 'Unix man page' },
];

const ROLE_TASK_PRESETS = [
  'Explain what a SQL injection is and how to prevent it.',
  'Describe how to set a strong password.',
  'Explain what a firewall does.',
];

function NodeRole() {
  const [provider, setProvider] = useState('openai');
  const [task, setTask] = useState(ROLE_TASK_PRESETS[0]);
  const [role, setRole] = useState(ROLE_OPTIONS[0].key);
  const [result, setResult] = useState<RoleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleRunId, setRoleRunId] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch('http://localhost:8000/day04/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, role, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as RoleResponse);
      setRoleRunId((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Role & behavior control"
        hint="Assign the model a persona and watch the same task come back in a completely different voice. Left is no role; right is the role you pick."
      />
      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setRole(o.key)}
              disabled={loading}
              className="border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition disabled:opacity-40"
              style={{
                borderColor: role === o.key ? VIZ.violet : 'var(--rule)',
                color: role === o.key ? VIZ.violet : undefined,
                background: role === o.key ? `${VIZ.violet}14` : undefined,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <PresetRow
          presets={ROLE_TASK_PRESETS}
          onPick={setTask}
          disabled={loading}
          labelPrefix="task"
        />
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          disabled={loading}
          rows={2}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <SubmitButton
          loading={loading}
          idle="Compare voices →"
          busy="Comparing…"
          disabled={loading || !task.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div
          className="border border-rule bg-paper/40 px-3 py-2"
          style={{ borderLeft: `2px solid ${VIZ.violet}` }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wide text-muted">
            Role system prompt
          </div>
          <div className="mt-0.5 font-mono text-[12px] leading-snug text-foreground/80">
            {result.role_system}
          </div>
        </div>
      )}

      {(result || loading) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <RoleColumn
            label="No role"
            color="#9CA3AF"
            side={result?.plain ?? null}
            loading={loading && !result}
          />
          <RoleColumn
            label="With role"
            color={VIZ.violet}
            side={result?.roled ?? null}
            loading={loading && !result}
          />
        </div>
      )}

      {result && (
        <Footer>
          {result.provider} · {result.model}
        </Footer>
      )}

      {result && <RoleVoiceVisual key={roleRunId} result={result} />}

      <ExplainerBlock
        title="A role is a behavior switch"
        body="Roles aren't cosmetic. By telling the model who it is, you change which knowledge it foregrounds, how terse it is, and what it refuses to do. The plain answer is the model's default voice; the roled answer is the same facts re-shaped for a specific audience. In production this is how you make one model serve a kids' app and a security console without retraining anything."
      />
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      nodes.push(<strong key={key++}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      nodes.push(
        <code
          key={key++}
          className="font-mono"
          style={{
            background: 'var(--paper)',
            padding: '1px 5px',
            borderRadius: 3,
            fontSize: 12,
          }}
        >
          {m[3]}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const isHeading = (s: string) => /^#{1,3}\s+/.test(s);
  const isBullet = (s: string) => /^[-*]\s+/.test(s);

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '```') {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre
          key={key++}
          style={{
            background: 'var(--paper)',
            border: '0.5px solid var(--rule)',
            borderRadius: 6,
            padding: '10px 12px',
            fontSize: 12,
            overflowX: 'auto',
            whiteSpace: 'pre',
          }}
        >
          <code className={lang ? `font-mono language-${lang}` : 'font-mono'}>
            {codeLines.join('\n')}
          </code>
        </pre>,
      );
      continue;
    }
    if (trimmed === '') {
      i++;
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length;
      const content = renderInline(h[2]);
      if (level === 1) {
        blocks.push(
          <h1 key={key++} className="text-base font-semibold">
            {content}
          </h1>,
        );
      } else if (level === 2) {
        blocks.push(
          <h2 key={key++} className="text-sm font-semibold">
            {content}
          </h2>,
        );
      } else {
        blocks.push(
          <h3 key={key++} className="text-[13px] font-semibold">
            {content}
          </h3>,
        );
      }
      i++;
      continue;
    }
    if (isBullet(trimmed)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && isBullet(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, '');
        items.push(<li key={items.length}>{renderInline(itemText)}</li>);
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc space-y-0.5 pl-5">
          {items}
        </ul>,
      );
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !isHeading(lines[i].trim()) &&
      !isBullet(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push(
      <p key={key++} className="leading-relaxed">
        {renderInline(para.join(' '))}
      </p>,
    );
  }

  return <div className="space-y-2">{blocks}</div>;
}

function RoleColumn({
  label,
  color,
  side,
  loading,
}: {
  label: string;
  color: string;
  side: RoleSide | null;
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
          asking…
        </div>
      ) : side ? (
        <>
          <div className="text-[13px] text-foreground/90">
            <MarkdownText text={side.answer} />
          </div>
          <Footer>
            {side.prompt_tokens}+{side.completion_tokens} tok
          </Footer>
        </>
      ) : null}
    </div>
  );
}

const ROLE_META: Record<string, { name: string; color: string }> = {
  security_engineer: { name: 'Security engineer', color: '#E24B4A' },
  kindergarten_teacher: { name: 'Kindergarten teacher', color: '#1D9E75' },
  unix_manpage: { name: 'Unix man page', color: '#378ADD' },
};

const JARGON_WORDS = [
  'sql',
  'injection',
  'cwe',
  'parameterized',
  'vulnerability',
  'exploit',
  'sanitize',
  'sanitized',
  'payload',
  'query',
  'prepared',
  'escaping',
  'owasp',
  'xss',
  'csrf',
  'authentication',
  'encryption',
  'firewall',
  'protocol',
  'mitigation',
];

const ANALOGY_PHRASES = ['like', 'imagine', 'think of', 'as if', 'similar to'];

type Traits = {
  formality: number;
  length: number;
  jargon: number;
  analogy: number;
};

function computeTraits(text: string): Traits {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const wc = tokens.length || 1;

  const avgLen =
    tokens.reduce((s, t) => s + t.replace(/[^a-zA-Z]/g, '').length, 0) / wc;
  const formality = avgLen > 5.5 ? 90 : avgLen < 4.5 ? 30 : 60;

  const length = wc < 50 ? 30 : wc <= 150 ? 60 : 90;

  const lower = text.toLowerCase();
  let jc = 0;
  for (const w of JARGON_WORDS) {
    const m = lower.match(new RegExp(`\\b${w}\\b`, 'g'));
    if (m) jc += m.length;
  }
  const jargon = Math.min(100, Math.round((jc / wc) * 100));

  let ac = 0;
  for (const p of ANALOGY_PHRASES) {
    ac += lower.split(p).length - 1;
  }
  const analogy = Math.min(100, ac * 20);

  return { formality, length, jargon, analogy };
}

type Voice = { id: string; name: string; color: string; text: string };

function voiceFromResult(r: RoleResult, index: number): Voice {
  if (!r.role_key) {
    return {
      id: `v${index}`,
      name: 'No role',
      color: '#9CA3AF',
      text: r.answer,
    };
  }
  const meta = ROLE_META[r.role_key];
  return {
    id: `v${index}`,
    name: meta ? meta.name : r.role_name,
    color: meta ? meta.color : VIZ.violet,
    text: r.answer,
  };
}

function RoleVoiceVisual({ result }: { result: RoleResponse }) {
  const voices: Voice[] = result.results.map((r, i) => voiceFromResult(r, i));

  const [traits, setTraits] = useState<Record<string, Traits>>({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const next: Record<string, Traits> = {};
    for (const v of voices) next[v.id] = computeTraits(v.text);
    setTraits(next);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="border-t border-rule pt-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
    >
      <div className="mb-4 space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Same task — three different roles
        </h3>
        <p className="text-xs text-muted">
          Same knowledge, completely different voice.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {voices.map((v) => {
          const t = traits[v.id] ?? {
            formality: 0,
            length: 0,
            jargon: 0,
            analogy: 0,
          };
          const excerpt =
            v.text.length > 120 ? `${v.text.slice(0, 120)}…` : v.text;
          return (
            <div
              key={v.id}
              className="space-y-3 border border-rule bg-paper p-3"
            >
              <span
                className="inline-block px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                style={{
                  color: v.color,
                  background: `${v.color}1F`,
                  border: `1px solid ${v.color}`,
                  borderRadius: 999,
                }}
              >
                {v.name}
              </span>

              <div
                className="px-3 py-1 text-[12px] italic leading-relaxed text-foreground/80"
                style={{ borderLeft: `2px solid ${v.color}` }}
              >
                <MarkdownText text={excerpt} />
              </div>

              <div className="space-y-1.5">
                <TraitBar
                  label="Formality"
                  pct={t.formality}
                  color={v.color}
                />
                <TraitBar label="Length" pct={t.length} color={v.color} />
                <TraitBar label="Jargon" pct={t.jargon} color={v.color} />
                <TraitBar label="Analogy" pct={t.analogy} color={v.color} />
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 bg-paper/40 p-3 text-[13px] leading-relaxed text-foreground/85"
        style={{ borderLeft: `2px solid ${VIZ.green}`, borderRadius: 8 }}
      >
        <span aria-hidden className="mr-1.5">
          💡
        </span>
        The facts never changed — only the role did. Same knowledge,
        completely different voice. This is how one model serves a security
        console and a kids&apos; app simultaneously.
      </div>
    </div>
  );
}

function TraitBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wide text-muted">
        <span>{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-[6px] w-full bg-rule">
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            background: color,
            transition: 'width 500ms ease-out',
          }}
        />
      </div>
    </div>
  );
}

// ─── N19 — ReAct ──────────────────────────────────────────────────

type ReactStep =
  | { type: 'thought'; text: string }
  | { type: 'action'; tool: string; input: string }
  | { type: 'observation'; text: string }
  | { type: 'answer'; text: string };
type ReactResponse = {
  question: string;
  steps: ReactStep[];
  answer: string;
  iterations: number;
  prompt_tokens: number;
  completion_tokens: number;
  provider: string;
  model: string;
};

const REACT_PRESETS = [
  'What is 24 * 7, and then add the speed of light in m/s to that?',
  'If pi is roughly 3.14159, what is pi times 100, minus 14?',
  'Earth radius in km, multiplied by 2 — what is that?',
];

const STEP_COLOR: Record<ReactStep['type'], string> = {
  thought: VIZ.violet,
  action: VIZ.blue,
  observation: VIZ.amber,
  answer: VIZ.green,
};

function NodeReact() {
  const [provider, setProvider] = useState('openai');
  const [question, setQuestion] = useState(REACT_PRESETS[0]);
  const [result, setResult] = useState<ReactResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      for (const t of timersRef.current) clearTimeout(t);
    };
  }, []);

  const reveal = (count: number) => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
    for (let i = 0; i < count; i++) {
      const t = setTimeout(() => {
        const el = stepRefs.current[i];
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'translateX(0)';
        }
      }, 120 + i * 280);
      timersRef.current.push(t);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch('http://localhost:8000/day04/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      const data = (await r.json()) as ReactResponse;
      setResult(data);
      stepRefs.current = [];
      requestAnimationFrame(() => reveal(data.steps.length));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="ReAct — reason + act"
        hint="The model alternates Thought → Action → Observation until it can answer. It never runs code itself; it asks for a tool, the server runs it, and the result comes back as an Observation."
      />
      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <PresetRow
          presets={REACT_PRESETS}
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
          idle="Run ReAct loop →"
          busy="Reasoning…"
          disabled={loading || !question.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      <div className="flex flex-wrap gap-2">
        <Badge value="calculator" color={VIZ.blue} />
        <Badge value="lookup" color={VIZ.amber} />
      </div>

      {result && (
        <div className="space-y-2">
          <ol className="space-y-2">
            {result.steps.map((s, i) => {
              const color = STEP_COLOR[s.type];
              const isAnswer = s.type === 'answer';
              return (
                <li
                  key={i}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  className="bg-paper p-3"
                  style={{
                    border: isAnswer
                      ? `1.5px solid ${color}`
                      : '1px solid var(--rule)',
                    borderLeft: isAnswer ? undefined : `2px solid ${color}`,
                    opacity: 0,
                    transform: 'translateX(-8px)',
                    transition:
                      'opacity 320ms ease-out, transform 320ms ease-out',
                  }}
                >
                  <div
                    className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{ color }}
                  >
                    <span>{s.type}</span>
                    {s.type === 'action' && (
                      <span
                        className="border px-1.5 py-0.5"
                        style={{ borderColor: color }}
                      >
                        {s.tool}
                      </span>
                    )}
                  </div>
                  {s.type === 'action' ? (
                    <pre className="whitespace-pre-wrap break-words font-mono text-[12px] text-foreground/85">
                      {s.input}
                    </pre>
                  ) : (
                    <p
                      className={[
                        'whitespace-pre-wrap text-[13px] leading-relaxed',
                        isAnswer
                          ? 'font-semibold text-foreground'
                          : 'text-foreground/85',
                      ].join(' ')}
                    >
                      {s.text}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          <Footer>
            {result.provider} · {result.model} · {result.iterations} iterations
            · {result.prompt_tokens}+{result.completion_tokens} tok
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="Reason, then act, then look"
        body="ReAct interleaves thinking and tool use. Each Thought decides what to do next, each Action calls a tool, each Observation feeds the real result back into context. The model is never trusted to do arithmetic in its head — it delegates to the calculator and reasons over the returned fact. That loop is the simplest possible agent, written entirely in the prompt instead of in code."
      />
    </div>
  );
}

// ─── N20 — Sampling / temperature ─────────────────────────────────

type TempResult = {
  temperature: number;
  response: string;
  prompt_tokens: number;
  completion_tokens: number;
};
type TemperatureResponse = {
  results: TempResult[];
  prompt: string;
  provider: string;
  model: string;
};

const TEMP_PRESETS = [
  'Write a one-line slogan for a coffee shop on Mars.',
  'Give a creative name for a friendly robot vacuum.',
  'Finish this story opener in one sentence: "The lighthouse had been dark for forty years, until…"',
];

const TEMPS = [0.0, 0.7, 1.4];

function NodeTemperature() {
  const [provider, setProvider] = useState('openai');
  const [prompt, setPrompt] = useState(TEMP_PRESETS[0]);
  const [result, setResult] = useState<TemperatureResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch('http://localhost:8000/day04/temperature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, temperatures: TEMPS, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as TemperatureResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const tempColor = (t: number) =>
    t <= 0.3 ? VIZ.blue : t <= 0.9 ? VIZ.amber : VIZ.coral;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Sampling / temperature"
        hint="Same prompt, three temperatures. Low temperature is focused and repeatable; high temperature is diverse and surprising. Watch the answer drift as the dial turns up."
      />
      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          onChange={setProvider}
          disabled={loading}
        />
        <PresetRow
          presets={TEMP_PRESETS}
          onPick={setPrompt}
          disabled={loading}
          labelPrefix="prompt"
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          rows={2}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <SubmitButton
          loading={loading}
          idle="Sample at 0.0 / 0.7 / 1.4 →"
          busy="Sampling…"
          disabled={loading || !prompt.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      <div className="space-y-1.5">
        <div
          className="h-[8px] w-full"
          style={{
            borderRadius: 4,
            background: `linear-gradient(to right, ${VIZ.blue}, ${VIZ.amber}, ${VIZ.coral})`,
          }}
        />
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-wide text-muted">
          <span>0.0 · focused</span>
          <span>0.7 · balanced</span>
          <span>1.4 · wild</span>
        </div>
      </div>

      {(result || loading) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(result?.results ?? TEMPS.map(() => null)).map((res, i) => {
            const t = res ? res.temperature : TEMPS[i];
            const color = tempColor(t);
            return (
              <div
                key={i}
                className="space-y-2 border border-rule bg-paper p-3"
                style={{ borderTop: `2px solid ${color}` }}
              >
                <div className="flex items-baseline justify-between">
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{ color }}
                  >
                    temp {t.toFixed(1)}
                  </div>
                  {res && (
                    <span className="font-mono text-[10px] text-muted">
                      {res.prompt_tokens}+{res.completion_tokens}
                    </span>
                  )}
                </div>
                {res ? (
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                    {res.response}
                  </p>
                ) : (
                  <div className="font-mono text-xs uppercase tracking-wide text-muted">
                    sampling…
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {result && (
        <Footer>
          {result.provider} · {result.model} · {result.results.length} samples
        </Footer>
      )}

      <ExplainerBlock
        title="Temperature is the creativity dial"
        body="At each step the model has a probability distribution over the next token. Temperature 0 always takes the single most likely token — deterministic and safe, great for extraction and code. Higher temperature flattens the distribution so less likely tokens get a chance — more variety, more risk of nonsense. Pick low for facts and structure, higher for brainstorming and prose."
      />
    </div>
  );
}
