'use client';

import { useState } from 'react';
import ModelSwitcher from '../../components/ModelSwitcher';
import { Markdown } from '../../components/Markdown';
import { useNodeProgress } from '../../components/useNodeProgress';
import DayPager from '../../components/DayPager';

const NODES = [
  { id: 'N81', label: 'Docker', title: 'Dockerizing AI apps' },
  { id: 'N82', label: 'CI/CD', title: 'CI/CD for AI apps' },
  { id: 'N83', label: 'Cost', title: 'Cost Optimization + Estimator' },
  { id: 'N84', label: 'Monitoring', title: 'Health checks & monitoring' },
  { id: 'N85', label: 'Zero-downtime', title: 'Blue/green deployment' },
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

export default function Day17Page() {
  const [activeId, setActiveId] = useState('N81');
  const [provider, setProvider] = useState('openai');
  const progress = useNodeProgress(17);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 17 · Production & Deployment
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
          Ship it, then{' '}
          <span className="text-accent">keep it running</span>.
        </h1>
        <p className="text-sm text-muted">
          Docker multi-stage, GitHub Actions CI/CD, cost-aware model routing,
          health checks, blue/green deploys. Plus a live multi-provider cost
          estimator. N81&ndash;N85.
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

      <div className={activeId === 'N81' ? undefined : 'hidden'}>
        <NodeDocker provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N82' ? undefined : 'hidden'}>
        <NodeCICD provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N83' ? undefined : 'hidden'}>
        <NodeCost provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N84' ? undefined : 'hidden'}>
        <NodeMonitoring provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N85' ? undefined : 'hidden'}>
        <NodeBlueGreen provider={provider} setProvider={setProvider} />
      </div>

      <DayPager day={17} advanced />
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
      const r = await fetch(`${API}/day17/ask`, {
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

// ─── N81 — Docker multi-stage ────────────────────────────────────

function NodeDocker({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dockerizing AI apps"
        hint="The pattern that turns a 2 GB build environment into a 200 MB shippable container: multi-stage builds. Stage 1 installs every compiler, header, and dev dep; stage 2 copies only the artifacts you actually need to run."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Multi-stage"
          body="Two FROM lines in one Dockerfile. The builder stage stays in your build cache; only the runtime stage ships. Shrinks images 5-10x for Python/Node apps."
          color={VIZ.blue}
        />
        <FactCard
          tag="Slim + distroless"
          body="`python:3.12-slim` strips man pages and locales (~50 MB savings). `gcr.io/distroless/python3` removes the shell entirely — smaller still, harder to exec into."
          color={VIZ.blue}
        />
        <FactCard
          tag="Layer caching"
          body="COPY requirements.txt + pip install BEFORE COPY src. Source changes don't invalidate the dep layer; rebuilds drop from 90s to 5s."
          color={VIZ.blue}
        />
        <FactCard
          tag=".dockerignore"
          body="Without it, your `node_modules` / `.git` / `.next` go into the build context. With it, the context drops from 800 MB to 5 MB; builds get instantly faster."
          color={VIZ.blue}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.blue}
        presets={[
          'Show me a multi-stage Dockerfile for a FastAPI app',
          'How do I get my Python image under 200 MB?',
          'What is the difference between slim and distroless base images?',
        ]}
        defaultQuestion="What does a multi-stage Dockerfile actually do?"
      />

      <DockerStagesVisual />

      <ExplainerBlock
        title="The single biggest container win"
        body="If your image is over 1 GB, multi-stage is the first lever. Builder installs gcc + python-dev + every wheel; runtime copies just `/app` and the prebuilt wheels. The build cache hierarchy matters too: copy `requirements.txt` first, install, then copy the source — that way changing one Python file doesn&apos;t reinstall the whole dependency tree. Both wins compound: smaller image + faster rebuild + smaller attack surface."
      />
    </div>
  );
}

function DockerStagesVisual() {
  const builderLayers = [
    { label: 'python:3.12 (base)', mb: 350, color: VIZ.grey },
    { label: 'apt-get build-essential', mb: 280, color: VIZ.coral },
    { label: 'pip wheel + compile deps', mb: 850, color: VIZ.coral },
    { label: 'copy app source', mb: 5, color: VIZ.coral },
  ];
  const runtimeLayers = [
    { label: 'python:3.12-slim (base)', mb: 120, color: VIZ.grey },
    { label: 'copy prebuilt wheels', mb: 65, color: VIZ.green },
    { label: 'copy app source', mb: 5, color: VIZ.green },
  ];
  const builderTotal = builderLayers.reduce((s, l) => s + l.mb, 0);
  const runtimeTotal = runtimeLayers.reduce((s, l) => s + l.mb, 0);
  const maxTotal = Math.max(builderTotal, runtimeTotal);

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          What stays vs what ships
        </h3>
        <p className="text-sm text-muted">
          The builder is heavy by design — gcc, compilers, dev headers. The
          runtime image only carries what you actually need to call
          `uvicorn`.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <StageColumn
          label="Stage 1 · builder"
          tag="FROM python:3.12 AS builder"
          color={VIZ.coral}
          layers={builderLayers}
          totalMb={builderTotal}
          maxTotal={maxTotal}
          note="stays in your build cache · never deployed"
        />
        <StageColumn
          label="Stage 2 · runtime"
          tag="FROM python:3.12-slim"
          color={VIZ.green}
          layers={runtimeLayers}
          totalMb={runtimeTotal}
          maxTotal={maxTotal}
          note="this is what gets pushed to the registry"
        />
      </div>

      <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        result · {builderTotal} MB build context ·{' '}
        <span style={{ color: VIZ.green }}>{runtimeTotal} MB shipped</span> ·{' '}
        ~{Math.round((1 - runtimeTotal / builderTotal) * 100)}% smaller
      </p>
    </div>
  );
}

function StageColumn({
  label,
  tag,
  color,
  layers,
  totalMb,
  maxTotal,
  note,
}: {
  label: string;
  tag: string;
  color: string;
  layers: { label: string; mb: number; color: string }[];
  totalMb: number;
  maxTotal: number;
  note: string;
}) {
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
          {label}
        </div>
        <code className="mt-0.5 block font-mono text-[11px] text-foreground/80">
          {tag}
        </code>
      </div>
      <div className="space-y-1.5">
        {layers.map((l, i) => {
          const pct = (l.mb / maxTotal) * 100;
          return (
            <div
              key={i}
              className="flex items-center gap-2 text-[11px]"
              title={`${l.mb} MB`}
            >
              <span
                className="w-44 shrink-0 truncate font-mono"
                style={{ color: l.color }}
              >
                {l.label}
              </span>
              <div className="relative h-3 flex-1 bg-rule/40">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${pct}%`,
                    background: l.color,
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-foreground/80">
                {l.mb} MB
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-rule pt-2 text-[11px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          total
        </span>
        <span className="font-mono font-semibold" style={{ color }}>
          {totalMb} MB
        </span>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {note}
      </p>
    </div>
  );
}

// ─── N82 — CI/CD pipeline flowchart ──────────────────────────────

function NodeCICD({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="CI/CD for AI apps"
        hint="A GitHub Actions workflow that runs the moment you push to main: lint + test → build the Docker image → push to a registry → SSH or deploy hook → health check → green. Or red — and then you roll back."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag=".github/workflows/deploy.yml"
          body="One YAML file at the repo root. on: push to main, jobs run on ubuntu-latest, each step is a uses: or run:. The whole pipeline lives in version control."
          color={VIZ.amber}
        />
        <FactCard
          tag="Secrets in repo settings"
          body="GitHub Actions exposes secrets as env vars to your steps. OPENAI_API_KEY, REGISTRY_TOKEN, SSH_KEY — never commit them. Use ${{ secrets.NAME }} in YAML."
          color={VIZ.amber}
        />
        <FactCard
          tag="Health check before promote"
          body="After deploy, curl /health on the new container. If it returns 200, promote it. If not, rollback to the previous tag — keep one revision back as the rollback target."
          color={VIZ.amber}
        />
        <FactCard
          tag="Test the eval, not the unit"
          body="For AI apps, traditional unit tests only catch shape regressions. Run a small RAGAS eval (Day 15) on every PR — that catches the prompt regressions unit tests can't."
          color={VIZ.amber}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.amber}
        presets={[
          'Show me a GitHub Actions workflow that deploys a FastAPI Docker app',
          'How do I roll back to the previous image if a deploy fails?',
          'What does a good AI-app test suite look like in CI?',
        ]}
        defaultQuestion="What does a CI/CD pipeline for an AI app look like?"
      />

      <PipelineVisual />

      <ExplainerBlock
        title="The push-to-deploy contract"
        body="A working pipeline is the contract that says &ldquo;merging to main means deploying to prod, and main is always green.&rdquo; If either half breaks, the whole social contract breaks: people stop merging because they don&apos;t trust the pipeline, or they merge anyway and prod breaks. The two non-negotiables: (1) every PR runs the test job, (2) the deploy job rolls back automatically on a failed health check. Everything else (cosmetic checks, eval suites, notifications) is incrementally additive."
      />
    </div>
  );
}

function PipelineVisual() {
  const [failedAt, setFailedAt] = useState<number | null>(null);

  const steps = [
    { name: 'push main', icon: '↳', desc: 'trigger', color: VIZ.grey },
    { name: 'lint + test', icon: '✓', desc: 'pytest + ruff', color: VIZ.green },
    { name: 'build image', icon: '⚒', desc: 'docker build', color: VIZ.blue },
    { name: 'push registry', icon: '↑', desc: 'ghcr.io/...', color: VIZ.blue },
    { name: 'deploy', icon: '⇉', desc: 'ssh + restart', color: VIZ.amber },
    { name: 'health check', icon: '♥', desc: 'curl /health', color: VIZ.amber },
    { name: 'deployed ✓', icon: '★', desc: 'green', color: VIZ.green },
  ];

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The pipeline, end to end
        </h3>
        <p className="text-sm text-muted">
          Click any step to simulate a failure there &mdash; the rollback
          path lights up.
        </p>
      </div>

      <div className="border border-rule bg-paper p-4 space-y-4">
        <div className="flex flex-wrap items-stretch gap-2">
          {steps.map((s, i) => {
            const isFail = failedAt === i;
            const isAfterFail = failedAt !== null && i > failedAt;
            const color = isFail ? VIZ.red : isAfterFail ? VIZ.grey : s.color;
            return (
              <div key={s.name} className="flex items-stretch gap-2">
                <button
                  onClick={() => setFailedAt(failedAt === i ? null : i)}
                  className="border bg-background px-2 py-1.5 text-left transition hover:border-foreground"
                  style={{
                    borderColor: color,
                    opacity: isAfterFail ? 0.4 : 1,
                  }}
                >
                  <div
                    className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{ color }}
                  >
                    <span aria-hidden>{isFail ? '✗' : s.icon}</span>
                    <span>{s.name}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] text-muted">
                    {s.desc}
                  </div>
                </button>
                {i < steps.length - 1 && (
                  <div className="flex items-center font-mono text-sm text-muted">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {failedAt !== null && (
          <div
            className="flex items-center gap-2 border-l-2 px-3 py-2 text-[12px]"
            style={{
              borderColor: VIZ.red,
              color: VIZ.red,
              background: `${VIZ.red}14`,
            }}
          >
            <span aria-hidden>⤺</span>
            <span>
              Rolled back to previous image · pipeline halted at{' '}
              <span className="font-mono">{steps[failedAt].name}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── N83 — Cost optimization + estimator ─────────────────────────

function NodeCost({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Cost Optimization"
        hint="LLM bills surprise teams. The four levers that flatten them: route easy queries to a smaller model, cache semantic duplicates, compress prompts, and pick the right provider for the request shape. The estimator below makes the provider-pick concrete."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Model routing"
          body="Classify the request first (one small-model call), then send 70% of easy queries to the smaller cheaper model. Typical savings: 40-60% with no quality drop."
          color={VIZ.green}
        />
        <FactCard
          tag="Semantic caching"
          body="Embed every query; if a recent one is similar enough, return the cached answer instead of calling the model. Hit rates of 20-40% are normal in QA apps."
          color={VIZ.green}
        />
        <FactCard
          tag="Prompt compression"
          body="Tools like LLMLingua remove low-information tokens from long context, often 30-50% smaller without measurable quality loss. Compounds with caching."
          color={VIZ.green}
        />
        <FactCard
          tag="Pick the cheap provider"
          body="At equal capability tiers, providers differ 5-15x in $/Mtok. Groq + Gemini Flash + DeepSeek dominate the cheap end; OpenAI premium tiers are 10x more."
          color={VIZ.green}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.green}
        presets={[
          'How do I implement semantic caching with embeddings?',
          'What does prompt compression actually do and when does it backfire?',
          'When does model routing beat just always using the cheap model?',
        ]}
        defaultQuestion="What are the four main ways to cut LLM cost in production?"
      />

      <CostEstimatorPanel />

      <CostOptimizationWaterfall />

      <ExplainerBlock
        title="The compounding effect"
        body="The numbers on individual levers feel modest — 30%, 40%, 25%. But they compound multiplicatively when stacked. Routing 70% of traffic to a model that costs ⅙ as much (say Groq Llama vs OpenAI gpt-4o-mini), then caching 30% of what&apos;s left, then compressing the remaining 70%&apos;s context by 40%, lands roughly at 12-18% of the original bill. The lesson: don&apos;t pick one optimization, layer all of them, and measure with the estimator before/after."
      />
    </div>
  );
}

type CostEstimate = {
  provider: string;
  model: string;
  monthly_cost_usd: number;
  cost_per_request_usd: number;
  input_rate_per_mtok_usd: number;
  output_rate_per_mtok_usd: number;
};

type CostResponse = {
  estimates: CostEstimate[];
  cheapest: string;
  cheapest_model: string;
  most_expensive: string;
  most_expensive_model: string;
  savings_vs_most_expensive_pct: number;
  inputs: {
    monthly_requests: number;
    avg_input_tokens: number;
    avg_output_tokens: number;
  };
};

function CostEstimatorPanel() {
  const [monthly, setMonthly] = useState(10000);
  const [inputTok, setInputTok] = useState(500);
  const [outputTok, setOutputTok] = useState(200);
  const [result, setResult] = useState<CostResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day17/cost-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthly_requests: monthly,
          avg_input_tokens: inputTok,
          avg_output_tokens: outputTok,
        }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as CostResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const maxMonthly = result
    ? Math.max(...result.estimates.map((e) => e.monthly_cost_usd), 0.0001)
    : 0;

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Multi-provider cost estimator
        </h3>
        <p className="text-sm text-muted">
          Same workload across every provider VAL knows about. No LLM call &mdash;
          this is pure math against the rate table in `token_tracker.RATES`.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="border border-rule bg-paper p-4 space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberField
            label="Monthly requests"
            id="cost-monthly"
            value={monthly}
            onChange={setMonthly}
            disabled={loading}
            min={1}
            max={1_000_000_000}
          />
          <NumberField
            label="Avg input tokens / req"
            id="cost-input"
            value={inputTok}
            onChange={setInputTok}
            disabled={loading}
            min={1}
            max={200_000}
          />
          <NumberField
            label="Avg output tokens / req"
            id="cost-output"
            value={outputTok}
            onChange={setOutputTok}
            disabled={loading}
            min={0}
            max={200_000}
          />
        </div>
        <SubmitButton
          loading={loading}
          idle="Estimate cost →"
          busy="Calculating…"
          disabled={loading}
        />
      </form>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-4">
          <div
            className="border-l-2 px-4 py-3 text-sm"
            style={{
              borderColor: VIZ.green,
              color: VIZ.green,
              background: `${VIZ.green}14`,
            }}
          >
            Choosing{' '}
            <span className="font-mono font-semibold">{result.cheapest}</span>{' '}
            ({result.cheapest_model}) saves{' '}
            <span className="font-mono font-semibold">
              {result.savings_vs_most_expensive_pct.toFixed(1)}%
            </span>{' '}
            vs{' '}
            <span className="font-mono font-semibold">
              {result.most_expensive}
            </span>{' '}
            at this workload.
          </div>

          <div className="border border-rule bg-paper p-3 space-y-2">
            {result.estimates.map((est, i) => {
              const isCheapest = est.provider === result.cheapest;
              const isMostExp = est.provider === result.most_expensive;
              const color = isCheapest
                ? VIZ.green
                : isMostExp
                  ? VIZ.red
                  : VIZ.blue;
              const pct = (est.monthly_cost_usd / maxMonthly) * 100;
              return (
                <div
                  key={i}
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 text-[12px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                      style={{
                        borderColor: color,
                        color,
                        background: `${color}1F`,
                      }}
                    >
                      {est.provider}
                    </span>
                    {isCheapest && (
                      <span
                        className="font-mono text-[10px]"
                        style={{ color: VIZ.green }}
                      >
                        cheapest ✓
                      </span>
                    )}
                  </div>
                  <div className="relative h-3 bg-rule/40">
                    <div
                      className="absolute inset-y-0 left-0 transition-[width]"
                      style={{
                        width: `${pct}%`,
                        background: color,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span
                    className="w-20 text-right font-mono"
                    style={{ color }}
                  >
                    ${est.monthly_cost_usd.toFixed(2)}/mo
                  </span>
                  <span className="w-24 text-right font-mono text-muted">
                    ${est.cost_per_request_usd.toFixed(6)}/req
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  id,
  value,
  onChange,
  disabled,
  min,
  max,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  min: number;
  max: number;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        disabled={disabled}
        min={min}
        max={max}
        className="w-full border border-rule bg-background p-2 font-mono text-sm outline-none focus:border-accent"
      />
    </div>
  );
}

const OPTIMIZATIONS: {
  id: string;
  label: string;
  multiplier: number;
  blurb: string;
}[] = [
  {
    id: 'routing',
    label: 'Model routing',
    multiplier: 0.6,
    blurb: 'Send 70% of easy queries to a smaller model',
  },
  {
    id: 'caching',
    label: 'Semantic caching',
    multiplier: 0.7,
    blurb: 'Return cached answers for similar queries',
  },
  {
    id: 'compression',
    label: 'Prompt compression',
    multiplier: 0.65,
    blurb: 'LLMLingua-style token reduction',
  },
];

function CostOptimizationWaterfall() {
  // Interactive: toggle each lever on/off. We compute the multiplicative
  // effect from a synthetic baseline so the user can feel the compounding.
  const BASELINE = 1000;
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    routing: true,
    caching: false,
    compression: false,
  });

  let running = BASELINE;
  const rows: { label: string; cost: number; on: boolean; pctOff: number }[] = [
    { label: 'Baseline', cost: BASELINE, on: true, pctOff: 0 },
  ];
  OPTIMIZATIONS.forEach((opt) => {
    const on = enabled[opt.id];
    if (on) {
      running = running * opt.multiplier;
    }
    const pctOff = ((BASELINE - running) / BASELINE) * 100;
    rows.push({
      label: `After ${opt.label.toLowerCase()}`,
      cost: running,
      on,
      pctOff,
    });
  });

  const maxCost = BASELINE;

  return (
    <div className="space-y-3 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The compounding waterfall
        </h3>
        <p className="text-sm text-muted">
          Toggle levers on and off. Baseline = $1,000/mo of LLM spend; each
          enabled lever multiplies what survived the previous step.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {OPTIMIZATIONS.map((opt) => {
          const on = enabled[opt.id];
          return (
            <button
              key={opt.id}
              onClick={() =>
                setEnabled((prev) => ({ ...prev, [opt.id]: !on }))
              }
              className={[
                'flex flex-col items-start gap-0.5 border px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-wide transition',
                on
                  ? 'border-accent bg-accent text-background'
                  : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
              ].join(' ')}
            >
              <span>
                {on ? '✓' : '○'} {opt.label}
              </span>
              <span
                className={[
                  'text-[9px] normal-case tracking-normal',
                  on ? 'text-background/80' : 'text-muted',
                ].join(' ')}
              >
                {opt.blurb}
              </span>
            </button>
          );
        })}
      </div>

      <div className="border border-rule bg-paper p-3 space-y-1.5">
        {rows.map((r, i) => {
          const pct = (r.cost / maxCost) * 100;
          const color = r.on
            ? i === 0
              ? VIZ.coral
              : VIZ.green
            : VIZ.grey;
          return (
            <div
              key={i}
              className="grid grid-cols-[14rem_1fr_auto_auto] items-center gap-3 text-[12px]"
              style={{ opacity: r.on ? 1 : 0.5 }}
            >
              <span
                className="truncate font-mono"
                style={{ color }}
              >
                {r.label}
              </span>
              <div className="relative h-3 bg-rule/40">
                <div
                  className="absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: color,
                    opacity: 0.85,
                  }}
                />
              </div>
              <span
                className="w-20 text-right font-mono"
                style={{ color }}
              >
                ${r.cost.toFixed(0)}
              </span>
              <span
                className="w-14 text-right font-mono text-muted"
                style={{ color: r.pctOff > 0 ? VIZ.green : VIZ.grey }}
              >
                {r.pctOff > 0 ? `-${r.pctOff.toFixed(0)}%` : '—'}
              </span>
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        Illustrative · real multipliers vary by traffic shape + cache hit rate
      </p>
    </div>
  );
}

// ─── N84 — Health checks & monitoring dashboard ──────────────────

function NodeMonitoring({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Health Checks & Monitoring"
        hint="The four panels that tell you what's wrong before users complain: p50/p95 latency, error rate, token spend, daily cost. If you only build one dashboard for an AI app, this is it."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="/health endpoint"
          body="GET /health returns 200 if the app can talk to its DB and provider. Used by load balancers + the deploy pipeline. Keep it under 50ms, don't do real work in it."
          color={VIZ.violet}
        />
        <FactCard
          tag="Latency p50 + p95"
          body="The average is a lie. p95 is what your slowest 5% of users experience — that's the SLO line. If p95 spikes, the average won't tell you."
          color={VIZ.violet}
        />
        <FactCard
          tag="Error rate, not error count"
          body="Errors as % of requests. 100 errors when you serve 100k req/min is noise; 100 when you serve 200 req/min is fire. Always divide by traffic."
          color={VIZ.violet}
        />
        <FactCard
          tag="Cost as a metric"
          body="LLM cost is observable in real time — it's just sum(rate * tokens). Alert when daily spend > 2x rolling-7d-median. Catches runaway loops + spam abuse."
          color={VIZ.violet}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.violet}
        presets={[
          'What should /health actually check for a FastAPI + Postgres + OpenAI app?',
          'How do I track p50 and p95 latency in FastAPI?',
          'What metrics should I alert on for an LLM app in production?',
        ]}
        defaultQuestion="What are the four metrics that matter for an AI app?"
      />

      <MonitoringDashboardVisual />

      <ExplainerBlock
        title="The first dashboard"
        body="Until you have these four panels, you&apos;re flying blind: you find out things broke from users, not from charts. The good news: every one of them is one SQL query against the `token_usage` table VAL already writes to (Day 1&apos;s `token_tracker`). The deployment isn&apos;t Grafana itself; the deployment is the discipline of looking at the panels before you ship and after you ship. The dashboard is the conversation starter; the alerts on top are what page you at 3am."
      />
    </div>
  );
}

function MonitoringDashboardVisual() {
  // Synthetic but plausible data for an LLM app. Numbers chosen so the
  // four panels feel like a real dashboard at a glance.
  const latencyBuckets = [
    { ms: 200, count: 5 },
    { ms: 400, count: 18 },
    { ms: 600, count: 32 },
    { ms: 800, count: 41 },
    { ms: 1000, count: 26 },
    { ms: 1200, count: 14 },
    { ms: 1500, count: 8 },
    { ms: 2000, count: 4 },
    { ms: 3000, count: 2 },
  ];
  const errorRate = [0.2, 0.3, 0.2, 0.4, 0.3, 0.5, 1.2, 0.4, 0.3, 0.2, 0.2];
  const tokenUsage = [
    { provider: 'openai', tok: 482000 },
    { provider: 'groq', tok: 1240000 },
    { provider: 'deepseek', tok: 98000 },
    { provider: 'gemini', tok: 312000 },
  ];
  const costSeries = [4.2, 3.8, 5.1, 4.9, 6.3, 7.1, 8.2];

  const maxLatencyCount = Math.max(...latencyBuckets.map((b) => b.count));
  const maxErrRate = Math.max(...errorRate, 1);
  const maxTokens = Math.max(...tokenUsage.map((t) => t.tok));
  const maxCost = Math.max(...costSeries);

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The four-panel dashboard
        </h3>
        <p className="text-sm text-muted">
          Synthetic data shaped to feel like a real Grafana view of a small
          production app.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <DashboardPanel title="Latency histogram" color={VIZ.violet}>
          <div className="space-y-1">
            <div className="flex items-end gap-1 h-20">
              {latencyBuckets.map((b, i) => {
                const h = (b.count / maxLatencyCount) * 100;
                const isP95 = b.ms >= 1500;
                return (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center justify-end"
                    title={`${b.ms} ms · ${b.count}`}
                  >
                    <div
                      className="w-full"
                      style={{
                        height: `${h}%`,
                        background: isP95 ? VIZ.red : VIZ.violet,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between font-mono text-[9px] text-muted">
              <span>p50 ~ 800 ms</span>
              <span style={{ color: VIZ.red }}>p95 ~ 1.8 s</span>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Error rate · last 10 min" color={VIZ.red}>
          <div className="space-y-1">
            <svg viewBox="0 0 110 30" className="h-20 w-full">
              <polyline
                fill="none"
                stroke={VIZ.red}
                strokeWidth="1.2"
                points={errorRate
                  .map((v, i) => {
                    const x = (i / (errorRate.length - 1)) * 100 + 5;
                    const y = 28 - (v / maxErrRate) * 26;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
              <line
                x1="5"
                x2="105"
                y1="6"
                y2="6"
                stroke={VIZ.grey}
                strokeWidth="0.3"
                strokeDasharray="2 2"
              />
            </svg>
            <div className="flex justify-between font-mono text-[9px] text-muted">
              <span>last 10 buckets</span>
              <span style={{ color: VIZ.red }}>
                spike 1.2% &mdash; investigate
              </span>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Token usage by provider · today" color={VIZ.blue}>
          <div className="space-y-1.5">
            {tokenUsage.map((t, i) => {
              const pct = (t.tok / maxTokens) * 100;
              return (
                <div
                  key={i}
                  className="grid grid-cols-[5rem_1fr_auto] items-center gap-2 text-[11px]"
                >
                  <span className="font-mono" style={{ color: VIZ.blue }}>
                    {t.provider}
                  </span>
                  <div className="relative h-2.5 bg-rule/40">
                    <div
                      className="absolute inset-y-0 left-0"
                      style={{
                        width: `${pct}%`,
                        background: VIZ.blue,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-foreground/80">
                    {(t.tok / 1000).toFixed(0)}k tok
                  </span>
                </div>
              );
            })}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Daily cost · last 7 days" color={VIZ.amber}>
          <div className="space-y-1">
            <svg viewBox="0 0 110 30" className="h-20 w-full">
              <polyline
                fill="none"
                stroke={VIZ.amber}
                strokeWidth="1.2"
                points={costSeries
                  .map((v, i) => {
                    const x = (i / (costSeries.length - 1)) * 100 + 5;
                    const y = 28 - (v / maxCost) * 26;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
              {costSeries.map((v, i) => {
                const x = (i / (costSeries.length - 1)) * 100 + 5;
                const y = 28 - (v / maxCost) * 26;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="1.2"
                    fill={VIZ.amber}
                  />
                );
              })}
            </svg>
            <div className="flex justify-between font-mono text-[9px] text-muted">
              <span>Mon</span>
              <span style={{ color: VIZ.amber }}>
                today $8.20 · trending up
              </span>
            </div>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}

function DashboardPanel({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="space-y-2 border bg-paper p-3"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── N85 — Blue/green deployment ─────────────────────────────────

function NodeBlueGreen({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Zero-downtime deployment"
        hint="Two stacks (blue + green). Only one serves traffic; the other is your warm spare. Deploy = stand up the spare with the new version, swap the load balancer, drain the old one. If anything breaks, swap back."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Blue/green"
          body="Two identical environments. Load balancer points at one; deploy spins up the other, health-checks it, and only flips traffic when green. Instant rollback by flipping back."
          color={VIZ.coral}
        />
        <FactCard
          tag="Rolling vs all-at-once"
          body="Kubernetes default: replace pods one at a time. Less hardware than blue/green but a window of mixed versions in flight — bad for breaking API changes."
          color={VIZ.coral}
        />
        <FactCard
          tag="PM2 reload"
          body="For Node apps without orchestration: pm2 reload sends SIGUSR2 to each worker, which finishes in-flight requests before exiting. Sequential drain, no hardware doubling."
          color={VIZ.coral}
        />
        <FactCard
          tag="Drain before kill"
          body="The hard part of zero-downtime is finishing in-flight LLM requests (sometimes 10+ seconds). Lame-duck mode: stop accepting new traffic, wait for in-flight to complete, then exit."
          color={VIZ.coral}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.coral}
        presets={[
          'How do I implement blue/green deployment on a single VPS?',
          'What is lame-duck mode and how do I implement it in FastAPI?',
          'When should I use rolling deploys instead of blue/green?',
        ]}
        defaultQuestion="What does blue/green deployment actually do?"
      />

      <BlueGreenVisual />

      <ExplainerBlock
        title="The instant-rollback trick"
        body="Blue/green&apos;s edge isn&apos;t the deploy itself &mdash; rolling deploys ship code too. It&apos;s the rollback latency. A bad rolling deploy takes as long to undo as it took to roll out: replace the same pods in reverse order. Blue/green takes one load-balancer config flip. For mission-critical AI apps where the cost of being broken for 5 minutes outweighs running two stacks at idle, that&apos;s the right trade. For everyone else, rolling with a good health check is usually enough."
      />
    </div>
  );
}

function BlueGreenVisual() {
  const [phase, setPhase] = useState<'idle' | 'spinup' | 'switching' | 'done'>(
    'idle',
  );

  const deploy = () => {
    setPhase('spinup');
    setTimeout(() => setPhase('switching'), 900);
    setTimeout(() => setPhase('done'), 1800);
  };
  const reset = () => setPhase('idle');

  const greenVisible = phase !== 'idle';
  const greenSolid = phase === 'switching' || phase === 'done';
  const blueActive = phase === 'idle' || phase === 'spinup';
  const blueTerminated = phase === 'done';

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Blue/green swap, step by step
        </h3>
        <p className="text-sm text-muted">
          The load-balancer arrow flips from blue to green only after green
          passes health checks. Reset to retry.
        </p>
      </div>

      <div className="border border-rule bg-paper p-4 space-y-4">
        <div
          className="mx-auto flex w-fit items-center gap-2 border px-4 py-1.5 font-mono text-[11px]"
          style={{ borderColor: VIZ.grey, color: VIZ.grey }}
        >
          load balancer
          <span aria-hidden style={{ color: VIZ.grey }}>
            →
          </span>
          <span
            className="font-semibold transition-colors"
            style={{
              color: blueActive ? VIZ.blue : VIZ.green,
            }}
          >
            {blueActive ? 'blue' : 'green'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StackBox
            label="Blue (v1.0)"
            color={VIZ.blue}
            active={blueActive}
            terminated={blueTerminated}
          />
          <StackBox
            label="Green (v1.1)"
            color={VIZ.green}
            active={greenSolid}
            visible={greenVisible}
            solid={greenSolid}
            spinningUp={phase === 'spinup'}
          />
        </div>

        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{
              color: phase === 'done' ? VIZ.green : VIZ.grey,
            }}
          >
            {phase === 'idle' && 'idle · awaiting deploy'}
            {phase === 'spinup' && 'green spinning up + health checking…'}
            {phase === 'switching' && 'load balancer swapping…'}
            {phase === 'done' && 'zero downtime ✓'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={deploy}
              disabled={phase !== 'idle'}
              className="border border-foreground bg-foreground px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
            >
              deploy →
            </button>
            <button
              onClick={reset}
              disabled={phase === 'idle'}
              className="border border-rule px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-foreground/80 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StackBox({
  label,
  color,
  active,
  terminated,
  visible = true,
  solid = true,
  spinningUp = false,
}: {
  label: string;
  color: string;
  active: boolean;
  terminated?: boolean;
  visible?: boolean;
  solid?: boolean;
  spinningUp?: boolean;
}) {
  const opacity = !visible ? 0 : terminated ? 0.4 : 1;
  const borderStyle = solid ? 'solid' : 'dashed';
  return (
    <div
      className="border bg-background p-4 transition-all duration-700"
      style={{
        borderColor: color,
        borderStyle,
        background: active ? `${color}10` : 'transparent',
        opacity,
      }}
    >
      <div
        className="font-mono text-[11px] uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {label}
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-muted">app</span>
          <span style={{ color }}>{spinningUp ? 'starting…' : 'running'}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-muted">health</span>
          <span style={{ color: active || solid ? color : VIZ.grey }}>
            {terminated ? 'terminated' : active ? 'serving traffic' : 'ready'}
          </span>
        </div>
      </div>
    </div>
  );
}
