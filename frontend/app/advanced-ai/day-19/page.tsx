'use client';

import { useState } from 'react';
import ModelSwitcher from '../../components/ModelSwitcher';
import { Markdown } from '../../components/Markdown';
import { useNodeProgress } from '../../components/useNodeProgress';
import DayPager from '../../components/DayPager';

const NODES = [
  { id: 'N91', label: 'Pricing', title: 'AI Product Pricing Models' },
  { id: 'N92', label: 'GTM', title: 'GTM Motions' },
  { id: 'N93', label: 'Demo Trap', title: 'The Demo Trap' },
  { id: 'N94', label: 'Responsible', title: 'Responsible AI Practices' },
  { id: 'N95', label: 'Case Studies', title: 'Case Studies' },
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

export default function Day19Page() {
  const [activeId, setActiveId] = useState('N91');
  const [provider, setProvider] = useState('openai');
  const progress = useNodeProgress(19);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 19 · AI Business & Products
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
          The{' '}
          <span className="text-accent">non-code half</span> of shipping AI.
        </h1>
        <p className="text-sm text-muted">
          Pricing models, GTM motions, the demo trap, responsible AI, and the
          five case studies worth memorizing &mdash; with a live tough-but-fair
          product critic that grades any idea you give it. N91&ndash;N95.
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

      <div className={activeId === 'N91' ? undefined : 'hidden'}>
        <NodePricing provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N92' ? undefined : 'hidden'}>
        <NodeGTM provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N93' ? undefined : 'hidden'}>
        <NodeDemoTrap provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N94' ? undefined : 'hidden'}>
        <NodeResponsible provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N95' ? undefined : 'hidden'}>
        <NodeCaseStudies provider={provider} setProvider={setProvider} />
      </div>

      <ProductCritiqueSection provider={provider} setProvider={setProvider} />

      <DayPager day={19} advanced />
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
      const r = await fetch(`${API}/day19/ask`, {
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

// ─── N91 — Pricing models + 2x2 matrix ───────────────────────────

function NodePricing({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI Product Pricing Models"
        hint="Four ways to price an AI product, each plotted by how predictable the cost is for the buyer and how well the price tracks the value delivered. Outcome-based is the holy grail; per-token is the easiest to ship."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Per-token"
          body="Pass the LLM bill through plus margin. Easy to ship, brutal for buyers who can't predict next month's spend. Most API products default here."
          color={VIZ.grey}
        />
        <FactCard
          tag="Per-seat"
          body="Charge by named user. Predictable revenue, familiar to enterprise buyers. The catch: heavy users subsidize light users, and your gross margin tanks if usage skews."
          color={VIZ.blue}
        />
        <FactCard
          tag="Usage tiers"
          body="$X for up to N requests/month, then overage. Buyer gets a budget; you get expansion revenue when they grow. Salesforce-style tier ladder."
          color={VIZ.teal}
        />
        <FactCard
          tag="Outcome-based"
          body="Pay per resolved ticket / generated PR / converted lead. Price tracks value 1:1. Hardest to sell because the buyer-side measurement bar is high."
          color={VIZ.green}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.green}
        presets={[
          'When does outcome-based pricing actually work?',
          'Why does per-token kill enterprise sales?',
          'How did Cursor land on per-seat pricing?',
        ]}
        defaultQuestion="Which pricing model should an AI startup default to?"
      />

      <PricingMatrixVisual />

      <ExplainerBlock
        title="The migration path nobody warns you about"
        body="Most AI startups ship on per-token because it&apos;s the closest match to their cost structure. The painful transition is moving up the matrix &mdash; first to usage tiers (so enterprise procurement can sign), then to outcome-based once the product is reliable enough to stake margin on. Each move makes pricing more defensible but harder to deliver. The bet on per-seat or outcome-based is also a bet that the model will keep getting better while your contracted price stays the same; if it doesn&apos;t, your margin compresses every quarter."
      />
    </div>
  );
}

const PRICING_QUADRANTS: {
  id: string;
  label: string;
  example: string;
  x: number;
  y: number;
  color: string;
  pros: string;
  cons: string;
}[] = [
  {
    id: 'per-token',
    label: 'Per-token',
    example: 'OpenAI API · raw passthrough + margin',
    x: 20,
    y: 25,
    color: VIZ.grey,
    pros: 'Easy to ship; matches cost 1:1.',
    cons: 'Unpredictable for buyers; kills enterprise procurement.',
  },
  {
    id: 'per-seat',
    label: 'Per-seat',
    example: 'Cursor · $20/seat/mo',
    x: 25,
    y: 75,
    color: VIZ.blue,
    pros: 'Predictable revenue; familiar to enterprise.',
    cons: 'Heavy users subsidize light users; margin risk under skew.',
  },
  {
    id: 'usage-tiers',
    label: 'Usage tiers',
    example: 'Anthropic · $X for N tokens/mo + overage',
    x: 70,
    y: 30,
    color: VIZ.teal,
    pros: 'Predictable budget for buyer; expansion path built in.',
    cons: 'Boundary games — buyers right-size to the next tier down.',
  },
  {
    id: 'outcome-based',
    label: 'Outcome-based',
    example: 'Harvey · per resolved matter · Sierra · per resolved ticket',
    x: 78,
    y: 78,
    color: VIZ.green,
    pros: 'Price tracks value 1:1; defensible against model churn.',
    cons: 'Hard sell; needs measurable outcomes both sides trust.',
  },
];

function PricingMatrixVisual() {
  const [selected, setSelected] = useState<string | null>('outcome-based');
  const sel = PRICING_QUADRANTS.find((q) => q.id === selected) ?? null;

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The pricing matrix
        </h3>
        <p className="text-sm text-muted">
          X axis: cost predictability for the buyer · Y axis: how tightly
          price tracks delivered value. Click a quadrant for pros + cons.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
        <div className="relative border border-rule bg-paper">
          <div className="aspect-5/4 relative">
            {/* axis grid */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="border-r border-b border-rule/40" />
              <div className="border-b border-rule/40" />
              <div className="border-r border-rule/40" />
              <div />
            </div>

            {/* quadrant labels (subtle, in corners) */}
            <div className="absolute left-2 top-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted/70">
              variable cost · high alignment
            </div>
            <div className="absolute right-2 top-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted/70">
              fixed cost · high alignment
            </div>
            <div className="absolute left-2 bottom-8 font-mono text-[9px] uppercase tracking-[0.18em] text-muted/70">
              variable · low alignment
            </div>
            <div className="absolute right-2 bottom-8 font-mono text-[9px] uppercase tracking-[0.18em] text-muted/70">
              fixed · low alignment
            </div>

            {/* axes */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-rule" />
            <div className="absolute top-0 bottom-0 left-0 border-r border-rule" />

            {/* bubbles */}
            {PRICING_QUADRANTS.map((q) => {
              const active = q.id === selected;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelected(active ? null : q.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition"
                  style={{
                    left: `${q.x}%`,
                    top: `${100 - q.y}%`,
                    color: q.color,
                  }}
                >
                  <div
                    className="flex flex-col items-center gap-0.5"
                    style={{ opacity: !selected || active ? 1 : 0.45 }}
                  >
                    <span
                      className="border bg-paper px-2 py-1 font-mono text-[11px] uppercase tracking-wide"
                      style={{
                        borderColor: q.color,
                        background: active
                          ? `${q.color}26`
                          : `${q.color}10`,
                        boxShadow: active
                          ? `0 0 0 2px ${q.color}66`
                          : 'none',
                      }}
                    >
                      {q.label}
                    </span>
                    <span className="font-mono text-[9px] text-muted max-w-56 text-center">
                      {q.example}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* axis labels (outside the chart) */}
          <div className="flex justify-between border-t border-rule px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            <span>← variable</span>
            <span>cost predictability →</span>
            <span>fixed →</span>
          </div>
          <div
            className="absolute -left-6 top-1/2 -rotate-90 font-mono text-[9px] uppercase tracking-[0.18em] text-muted"
            style={{ transformOrigin: 'left center' }}
          >
            value alignment →
          </div>
        </div>

        <div
          className="space-y-3 border bg-paper p-3"
          style={{
            borderLeft: sel ? `3px solid ${sel.color}` : `3px solid ${VIZ.grey}`,
          }}
        >
          {sel ? (
            <>
              <div>
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: sel.color }}
                >
                  {sel.label}
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-muted">
                  {sel.example}
                </p>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                  Pros
                </div>
                <p className="text-[12px] text-foreground/85">{sel.pros}</p>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                  Cons
                </div>
                <p className="text-[12px] text-foreground/85">{sel.cons}</p>
              </div>
            </>
          ) : (
            <p className="font-mono text-[11px] text-muted">
              Click a quadrant to see its trade-offs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── N92 — GTM motions ──────────────────────────────────────────

function NodeGTM({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="GTM Motions"
        hint="Three repeatable shapes for getting an AI product into customer hands: PLG (bottom-up, individuals → teams → enterprise), API-first (developers as the wedge), Vertical SaaS (industry-specific, top-down). Each has a recognizable adoption curve."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        <FactCard
          tag="PLG · Product-led"
          body="Self-serve signup, free or freemium, viral loops. Adoption curve is exponential bottom-up once one team gets hooked. Examples: Cursor, Notion AI, Perplexity."
          color={VIZ.blue}
        />
        <FactCard
          tag="API-first"
          body="Developers as the wedge. Free credits + docs are the marketing. Adoption is step-function as each major framework adds an integration. OpenAI, ElevenLabs, Replicate."
          color={VIZ.violet}
        />
        <FactCard
          tag="Vertical SaaS"
          body="One industry, deep workflow integration, top-down sales. Slow ramp, steep contracts. Harvey (law), Glean (enterprise search), Sierra (CX support)."
          color={VIZ.teal}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.violet}
        presets={[
          'When does API-first GTM win and when does it stall?',
          'Why does PLG work for Cursor but not for Harvey?',
          'How long does a Vertical SaaS sales cycle take?',
        ]}
        defaultQuestion="Which GTM motion fits a developer-facing AI product?"
      />

      <GTMCurvesVisual />

      <ExplainerBlock
        title="Match the shape to the buyer"
        body="The wrong GTM motion is usually fatal &mdash; building a vertical-SaaS sales team for a $20 product, or trying to land a Fortune 500 with self-serve signup, both burn 12-24 months. The buyer&apos;s procurement shape decides for you: if the user can swipe a card, PLG; if they need their CTO involved, API-first; if they need legal + security review + a master agreement, Vertical SaaS. Switching motions later is possible (Notion went PLG→enterprise) but requires building a second go-to-market team in parallel, not a hand-off."
      />
    </div>
  );
}

const GTM_MOTIONS: {
  id: string;
  label: string;
  examples: string;
  shape: 'exponential' | 'stepfunction' | 'sigmoid';
  color: string;
  note: string;
}[] = [
  {
    id: 'plg',
    label: 'PLG · Product-led',
    examples: 'Cursor · Perplexity · Notion AI',
    shape: 'exponential',
    color: VIZ.blue,
    note: 'Bottom-up · viral loops · individual → team → enterprise',
  },
  {
    id: 'api',
    label: 'API-first',
    examples: 'OpenAI · ElevenLabs · Replicate',
    shape: 'stepfunction',
    color: VIZ.violet,
    note: 'Developer wedge · framework integrations drive each step',
  },
  {
    id: 'vsaas',
    label: 'Vertical SaaS',
    examples: 'Harvey · Glean · Sierra',
    shape: 'sigmoid',
    color: VIZ.teal,
    note: 'Top-down · 12-18mo sales cycle · large ACV',
  },
];

function GTMCurvesVisual() {
  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Three GTM curves
        </h3>
        <p className="text-sm text-muted">
          Stylized adoption shapes over time. The first 18 months look
          completely different in each motion &mdash; that&apos;s why mixing
          them mid-build kills companies.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {GTM_MOTIONS.map((m) => (
          <GTMCard key={m.id} motion={m} />
        ))}
      </div>
    </div>
  );
}

function GTMCard({
  motion,
}: {
  motion: (typeof GTM_MOTIONS)[number];
}) {
  // Build a stylized curve as an SVG polyline. Each shape produces 20
  // sample points across the 0-100 x-range; y normalized into 5-95.
  const N = 20;
  const points: string[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    let y = 0;
    if (motion.shape === 'exponential') {
      // Slow start, then steep — y = t^3
      y = Math.pow(t, 3);
    } else if (motion.shape === 'stepfunction') {
      // Quantized steps at t=0.2, 0.5, 0.8
      if (t < 0.18) y = 0.1;
      else if (t < 0.5) y = 0.35;
      else if (t < 0.78) y = 0.65;
      else y = 0.92;
    } else {
      // sigmoid · slow start, fast middle, plateau
      const k = 9;
      y = 1 / (1 + Math.exp(-k * (t - 0.55)));
    }
    const x = 5 + t * 90;
    const yPos = 95 - y * 90;
    points.push(`${x.toFixed(1)},${yPos.toFixed(1)}`);
  }

  return (
    <div
      className="space-y-2 border bg-paper p-3"
      style={{ borderTop: `2px solid ${motion.color}` }}
    >
      <div>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: motion.color }}
        >
          {motion.label}
        </div>
        <p className="mt-0.5 text-[11px] text-muted">{motion.examples}</p>
      </div>
      <svg viewBox="0 0 100 100" className="h-24 w-full">
        <polyline
          fill="none"
          stroke={motion.color}
          strokeWidth="1.4"
          points={points.join(' ')}
        />
        <line
          x1="5"
          y1="95"
          x2="95"
          y2="95"
          stroke={VIZ.grey}
          strokeWidth="0.3"
        />
        <line
          x1="5"
          y1="5"
          x2="5"
          y2="95"
          stroke={VIZ.grey}
          strokeWidth="0.3"
        />
        <text
          x="50"
          y="99"
          fontSize="6"
          fill={VIZ.grey}
          fontFamily="monospace"
          textAnchor="middle"
        >
          time →
        </text>
      </svg>
      <p
        className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted"
      >
        {motion.note}
      </p>
    </div>
  );
}

// ─── N93 — Demo trap split-screen ────────────────────────────────

function NodeDemoTrap({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="The Demo Trap"
        hint="The viral demo is curated, fast, cheap, and chosen to land. Production is the opposite — messy inputs, tail latencies, edge cases, runaway costs, and hallucinations users care about. The gap is what kills 80% of AI startups."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Curation theater"
          body="The demo runs on 5 cherry-picked inputs that work. Production runs on 5,000 weird inputs you didn't anticipate. The 'wow' rate plunges from 100% to 60% the moment users arrive."
          color={VIZ.red}
        />
        <FactCard
          tag="Latency tail"
          body="Demo: p50. Production: p99. The model that returns in 800ms for the demo question can take 8 seconds on a real one with retrieval + reranking. Users notice the tail, not the median."
          color={VIZ.red}
        />
        <FactCard
          tag="Cost reality"
          body="Demo: one $0.02 call. Production: 100k users × 10 calls/day × $0.05 = $5k/day before you bill anyone. The unit economics that work in a demo rarely survive at scale."
          color={VIZ.red}
        />
        <FactCard
          tag="The hallucination tax"
          body="Demo viewers laugh at a confidently wrong answer. Users sue. As soon as a model produces output that anyone relies on, every hallucination is a support ticket or a liability."
          color={VIZ.red}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.red}
        presets={[
          'What is the demo trap and how do AI startups fall into it?',
          'Why does p99 latency matter so much for production LLM apps?',
          'How do I tell if my demo will survive contact with users?',
        ]}
        defaultQuestion="Why do most AI demos fail in production?"
      />

      <DemoVsProductionSplit />

      <ExplainerBlock
        title="The conversion you need to plan for"
        body="The demo-to-production gap isn&apos;t a one-time porting job &mdash; it&apos;s a permanent operating cost. You need (a) a real input distribution from before launch (real users, not the founder&apos;s test set), (b) a cost model that survives 100x usage, (c) an eval suite (Day 15) that catches the &ldquo;works in demo, breaks in prod&rdquo; class of regression, and (d) a safety story for the failure modes you can predict. Skip any of these and you&apos;ll burn 6-12 months relearning them from incidents."
      />
    </div>
  );
}

const DEMO_COL = [
  { label: 'Curated test inputs', detail: '5 cherry-picked examples' },
  { label: 'p50 latency', detail: '~800 ms' },
  { label: '$0.02 / call', detail: 'one founder + one demo viewer' },
  { label: '99% wow rate', detail: 'on the curated set' },
  { label: 'Founder is the user', detail: 'knows the unwritten rules' },
];

const PROD_COL = [
  { label: 'Real input distribution', detail: 'weird, long, multi-language' },
  { label: 'p99 latency', detail: '~8 s on RAG + reranking' },
  { label: '$0.05 / call × 1M / mo', detail: '$50k bill before MRR' },
  { label: '60% wow rate', detail: 'and a long tail of failures' },
  { label: 'Strangers are the users', detail: 'and they sue' },
];

function DemoVsProductionSplit() {
  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Demo vs production
        </h3>
        <p className="text-sm text-muted">
          Same product, two environments. The right column is what you build
          for if you want to still exist in 18 months.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SplitColumn
          title="Demo environment"
          subtitle="curated · fast · cheap · loved"
          color={VIZ.green}
          tone="positive"
          rows={DEMO_COL}
        />
        <SplitColumn
          title="Production reality"
          subtitle="messy · slow · expensive · scrutinized"
          color={VIZ.red}
          tone="negative"
          rows={PROD_COL}
        />
      </div>
    </div>
  );
}

function SplitColumn({
  title,
  subtitle,
  color,
  tone,
  rows,
}: {
  title: string;
  subtitle: string;
  color: string;
  tone: 'positive' | 'negative';
  rows: { label: string; detail: string }[];
}) {
  const mark = tone === 'positive' ? '✓' : '✗';
  return (
    <div
      className="space-y-3 border bg-paper p-4"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color }}
        >
          {title}
        </div>
        <p className="mt-0.5 font-mono text-[10px] text-muted">{subtitle}</p>
      </div>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px]">
            <span
              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center font-mono text-[10px]"
              style={{
                color: tone === 'positive' ? color : color,
                border: `1px solid ${color}`,
                background: `${color}1A`,
              }}
              aria-hidden
            >
              {mark}
            </span>
            <div>
              <div className="font-semibold">{r.label}</div>
              <div className="text-[11px] text-muted">{r.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── N94 — Responsible AI checklist ──────────────────────────────

function NodeResponsible({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Building Responsibly"
        hint="Six concrete practices grouped under transparency, safety, and user control. Not the lawyer version — the working engineering checklist. If you can answer 'yes, we do this' to all six, you're ahead of most AI products shipping in 2026."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        <FactCard
          tag="Transparency"
          body="Label AI-generated output. Disclose the model + version used. Users should never have to guess whether the thing they're reading came from a human or a machine."
          color={VIZ.blue}
        />
        <FactCard
          tag="Safety"
          body="Have a content-moderation layer. Run an eval suite (Day 15) on every prompt change. Keep a list of known harms with the mitigation for each."
          color={VIZ.amber}
        />
        <FactCard
          tag="User control"
          body="Let users opt out of training on their data. Let them export and delete what you've stored. Give them a 'why did the AI say that' affordance."
          color={VIZ.green}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.green}
        presets={[
          'What does responsible AI look like for a small startup with no policy team?',
          'How do I label AI-generated output without breaking the UX?',
          'What is the minimum content-moderation setup before launch?',
        ]}
        defaultQuestion="What are the basic responsible-AI practices every product should ship with?"
      />

      <ResponsibleChecklist />

      <ExplainerBlock
        title="The bar that&apos;s about to get higher"
        body="Regulation is catching up &mdash; the EU AI Act, the US executive orders, sector rules in finance and health. By the time it&apos;s mandatory, you&apos;ll be retrofitting features instead of designing them in. The cheap path: bake the six items below into v1, even half-heartedly. Users notice (and tell their procurement team) when a product respects them; competitors find out the hard way when they don&apos;t."
      />
    </div>
  );
}

const RESPONSIBLE_ITEMS: {
  category: 'Transparency' | 'Safety' | 'User control';
  title: string;
  description: string;
}[] = [
  {
    category: 'Transparency',
    title: 'Label AI-generated content',
    description:
      'Use a clear marker (icon + tooltip) on any output the model produced. Users should never confuse it with a human reply.',
  },
  {
    category: 'Transparency',
    title: 'Disclose model + version',
    description:
      'Surface which model produced the answer somewhere — at minimum in support contexts so debugging is possible.',
  },
  {
    category: 'Safety',
    title: 'Content-moderation layer',
    description:
      'Run a moderation pass on outputs and on user-provided context before storing or sending. OpenAI Moderation API, Llama Guard, or similar.',
  },
  {
    category: 'Safety',
    title: 'Continuous eval against regressions',
    description:
      'Wire a small RAGAS / LangSmith eval into CI (Day 15). Catches prompt or retrieval changes that quietly break behavior.',
  },
  {
    category: 'User control',
    title: 'Opt out of training',
    description:
      "Honor 'do not train on my data' as a first-class setting. Make sure the data plane actually respects it — not just the marketing.",
  },
  {
    category: 'User control',
    title: 'Export + delete data',
    description:
      'GDPR-shaped affordances: a one-click export of what you have, and a verifiable delete. Both should work for the AI features specifically.',
  },
];

const CATEGORY_COLOR: Record<string, string> = {
  Transparency: VIZ.blue,
  Safety: VIZ.amber,
  'User control': VIZ.green,
};

function ResponsibleChecklist() {
  return (
    <div className="space-y-3 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The six-item launch checklist
        </h3>
        <p className="text-sm text-muted">
          Grouped by category. Six items appears with a 100ms-staggered
          fade-in so the list reads as one motion.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {RESPONSIBLE_ITEMS.map((item, i) => {
          const color = CATEGORY_COLOR[item.category];
          return (
            <li
              key={i}
              className="border bg-paper p-3"
              style={{
                borderLeft: `3px solid ${color}`,
                animation: `respFadeIn 320ms ease-out ${i * 100}ms both`,
              }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px]"
                  style={{
                    border: `1px solid ${color}`,
                    color,
                    background: `${color}1F`,
                  }}
                  aria-hidden
                >
                  ✓
                </span>
                <div className="space-y-0.5">
                  <div
                    className="font-mono text-[9px] uppercase tracking-[0.18em]"
                    style={{ color }}
                  >
                    {item.category}
                  </div>
                  <div className="font-serif text-[14px] font-semibold">
                    {item.title}
                  </div>
                  <p className="text-[12px] leading-snug text-foreground/80">
                    {item.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <style jsx global>{`
        @keyframes respFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// ─── N95 — Case studies (flip cards) ─────────────────────────────

function NodeCaseStudies({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Case Studies"
        hint="Five AI products worth knowing in 2026 — each one a different GTM motion, each a different pricing bet. Hover the cards to read the front; click to flip and see the lesson on the back."
      />
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.coral}
        presets={[
          'How did Cursor reach $200M ARR in two years?',
          "Why is Harvey's pricing structure unusual for legal software?",
          'What is the moat for Perplexity vs ChatGPT search?',
        ]}
        defaultQuestion="Which of these case studies has the most replicable playbook?"
      />

      <CaseStudyGallery />

      <ExplainerBlock
        title="The pattern across all five"
        body="None of these companies won on the model. All five sit on the same closed-API LLMs as their competitors. They won on the wrapper &mdash; pick a single high-value workflow, instrument it deeply, charge accordingly, and own the user trust before someone with a bigger model commoditizes them. The model is not the moat; the workflow integration + brand + data flywheel are. Worth re-reading whenever &ldquo;but they have GPT-5 too&rdquo; becomes the comfort argument."
      />
    </div>
  );
}

const CASE_STUDIES: {
  name: string;
  description: string;
  gtm: 'PLG' | 'API-first' | 'Vertical SaaS';
  pricing: string;
  why: string;
  metric: string;
  color: string;
}[] = [
  {
    name: 'Cursor',
    description: 'AI-native code editor. VS Code fork with a tab autocomplete that nailed the latency budget.',
    gtm: 'PLG',
    pricing: 'Per-seat',
    why: 'Took the latency budget seriously when everyone else accepted 800ms — felt instant, which made it stick. Per-seat priced for individual devs first, then teams.',
    metric: '$200M ARR · ~2 years to $100M',
    color: VIZ.blue,
  },
  {
    name: 'Harvey',
    description: 'AI for elite law firms. Vertical SaaS with deep workflow integration into discovery and contracts.',
    gtm: 'Vertical SaaS',
    pricing: 'Per-seat + outcome',
    why: 'Picked one industry where ACV justifies a long sales cycle. The model is closed-API; the value is the legal-grade workflow + audit trail wrapped around it.',
    metric: '~$50M ARR · $5B valuation',
    color: VIZ.teal,
  },
  {
    name: 'Perplexity',
    description: 'AI answer engine with citations. PLG against Google with a faster, more readable result page.',
    gtm: 'PLG',
    pricing: 'Per-seat (Pro)',
    why: 'Bet the brand on citations — a trust feature that ChatGPT did not have at launch. Built a referral / sharing loop that turned every answer into a marketing surface.',
    metric: '~$80M ARR · 15M MAU',
    color: VIZ.blue,
  },
  {
    name: 'ElevenLabs',
    description: 'Voice AI API + dubbing studio. API-first wedge with a polished consumer UI on top.',
    gtm: 'API-first',
    pricing: 'Usage tiers',
    why: 'Won by a clear quality margin on voice cloning, then added a consumer-grade studio so individual creators became distribution. Usage tiers scaled cleanly from hobby to enterprise.',
    metric: '~$100M ARR · $3B valuation',
    color: VIZ.violet,
  },
  {
    name: 'Glean',
    description: 'Enterprise AI search. Connects all your SaaS apps and lets employees ask one question.',
    gtm: 'Vertical SaaS',
    pricing: 'Per-seat',
    why: 'Solved a problem every 1000+ employee company has but nobody had wrapped — knowledge fragmentation across 30 SaaS tools. Connectors are the moat; the LLM is the visible layer.',
    metric: '~$100M ARR · $4.6B valuation',
    color: VIZ.teal,
  },
];

const GTM_COLOR: Record<string, string> = {
  PLG: VIZ.blue,
  'API-first': VIZ.violet,
  'Vertical SaaS': VIZ.teal,
};

function CaseStudyGallery() {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const toggle = (name: string) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">
            Five products, five wedges
          </h3>
          <p className="text-sm text-muted">
            Click any card to flip it. Front: what they do. Back: why it
            worked + the impressive number.
          </p>
        </div>
        <button
          onClick={() => setFlipped(new Set())}
          disabled={flipped.size === 0}
          className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/80 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
        >
          reset all
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CASE_STUDIES.map((c) => {
          const isFlipped = flipped.has(c.name);
          return (
            <button
              key={c.name}
              onClick={() => toggle(c.name)}
              className="relative h-80 w-full text-left"
              style={{ perspective: '1000px' }}
              aria-label={`${c.name} — click to ${isFlipped ? 'show front' : 'show why it worked'}`}
            >
              <div
                className="relative h-full w-full transition-transform duration-700"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'none',
                }}
              >
                <div
                  className="absolute inset-0 flex flex-col gap-2 overflow-hidden border bg-paper p-4"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    borderTop: `2px solid ${c.color}`,
                  }}
                >
                  <div className="space-y-1">
                    <div
                      className="font-mono text-[9px] uppercase tracking-[0.18em]"
                      style={{ color: c.color }}
                    >
                      case study
                    </div>
                    <h4 className="font-serif text-xl font-semibold">
                      {c.name}
                    </h4>
                  </div>
                  <p className="text-[12px] leading-snug text-foreground/80">
                    {c.description}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span
                      className="border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide"
                      style={{
                        borderColor: GTM_COLOR[c.gtm],
                        color: GTM_COLOR[c.gtm],
                        background: `${GTM_COLOR[c.gtm]}1F`,
                      }}
                    >
                      {c.gtm}
                    </span>
                    <span
                      className="border border-rule px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-foreground/70"
                    >
                      {c.pricing}
                    </span>
                  </div>
                  <div className="mt-auto pt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                    click to flip ↻
                  </div>
                </div>

                <div
                  className="absolute inset-0 flex flex-col gap-3 overflow-hidden border bg-paper p-4"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    borderTop: `2px solid ${c.color}`,
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div
                      className="font-mono text-[9px] uppercase tracking-[0.18em]"
                      style={{ color: c.color }}
                    >
                      why it worked
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">
                      {c.why}
                    </p>
                  </div>
                  <div className="mt-auto border-t border-rule pt-2">
                    <div
                      className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted"
                    >
                      Key metric
                    </div>
                    <p
                      className="mt-0.5 font-mono text-[12px]"
                      style={{ color: c.color }}
                    >
                      {c.metric}
                    </p>
                    <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                      click to flip back ↻
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Product critique (always-visible footer) ────────────────────

type CritiqueResponse = {
  idea: string;
  demo_trap: string;
  pricing_model: string;
  pricing_reason: string;
  gtm_motion: 'PLG' | 'API-first' | 'Vertical SaaS';
  gtm_reason: string;
  safety_concern: string;
  viability_score: number;
  viability_reason: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

const IDEA_PRESETS = [
  'An AI that reads your emails and drafts replies automatically.',
  'A vertical SaaS that summarizes radiology scans for rural clinics.',
  'A consumer app that turns any photo into a 60-second video story.',
];

function ProductCritiqueSection({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  const [idea, setIdea] = useState(IDEA_PRESETS[0]);
  const [result, setResult] = useState<CritiqueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day19/product-critique`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as CritiqueResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 border-t border-rule pt-8">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl font-semibold">
          Tough-but-fair product critic
        </h2>
        <p className="text-sm text-muted">
          Pitch your AI product idea in one or two sentences. The model
          returns a viability score, the most likely demo trap, a pricing +
          GTM recommendation, and the safety concern most likely to bite
          first.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          setProvider={setProvider}
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          {IDEA_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdea(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              preset {i + 1}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <label
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
            htmlFor="critique-idea"
          >
            Your idea
          </label>
          <textarea
            id="critique-idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={loading}
            rows={3}
            placeholder="Describe your AI product idea in one or two sentences"
            className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
          />
        </div>
        <SubmitButton
          loading={loading}
          idle="Critique this idea →"
          busy="Judging…"
          disabled={loading || !idea.trim()}
        />
      </form>

      {error && <ErrorBox message={error} />}
      {result && <CritiqueResult result={result} />}
    </section>
  );
}

function viabilityColor(score: number): string {
  if (score >= 8) return VIZ.green;
  if (score >= 5) return VIZ.amber;
  return VIZ.red;
}

function CritiqueResult({ result }: { result: CritiqueResponse }) {
  const vcolor = viabilityColor(result.viability_score);
  return (
    <div className="space-y-4">
      <div
        className="border bg-paper p-4"
        style={{ borderTop: `2px solid ${vcolor}` }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center border"
            style={{ borderColor: vcolor, background: `${vcolor}14` }}
          >
            <span
              className="font-serif text-3xl font-bold leading-none"
              style={{ color: vcolor }}
            >
              {result.viability_score}
            </span>
            <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
              / 10
            </span>
          </div>
          <div className="flex-1 space-y-1">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: vcolor }}
            >
              viability
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              {result.viability_reason}
            </p>
            <Footer>
              {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
              {result.latency_ms}ms
            </Footer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CritiqueCell
          icon="🎭"
          label="Demo trap risk"
          color={VIZ.red}
          body={result.demo_trap}
        />
        <CritiqueCell
          icon="💰"
          label="Pricing model"
          color={VIZ.green}
          badge={result.pricing_model}
          badgeColor={VIZ.green}
          body={result.pricing_reason}
        />
        <CritiqueCell
          icon="🚀"
          label="GTM motion"
          color={GTM_COLOR[result.gtm_motion] ?? VIZ.violet}
          badge={result.gtm_motion}
          badgeColor={GTM_COLOR[result.gtm_motion] ?? VIZ.violet}
          body={result.gtm_reason}
        />
        <CritiqueCell
          icon="🛡️"
          label="Safety concern"
          color={VIZ.amber}
          body={result.safety_concern}
        />
      </div>
    </div>
  );
}

function CritiqueCell({
  icon,
  label,
  color,
  body,
  badge,
  badgeColor,
}: {
  icon: string;
  label: string;
  color: string;
  body: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div
      className="space-y-2 border bg-paper p-4"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[16px]" aria-hidden>
            {icon}
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color }}
          >
            {label}
          </span>
        </div>
        {badge && (
          <span
            className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
            style={{
              borderColor: badgeColor ?? color,
              color: badgeColor ?? color,
              background: `${badgeColor ?? color}1F`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="text-[12px] leading-relaxed text-foreground/85">{body}</p>
    </div>
  );
}
