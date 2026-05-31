'use client';

import { useState } from 'react';
import ModelSwitcher from '../../components/ModelSwitcher';
import { Markdown } from '../../components/Markdown';
import { useNodeProgress } from '../../components/useNodeProgress';
import DayPager from '../../components/DayPager';

const NODES = [
  { id: 'N61', label: 'AWS Bedrock', title: 'AWS Bedrock' },
  { id: 'N62', label: 'GCP Vertex AI', title: 'GCP Vertex AI' },
  { id: 'N63', label: 'Azure OpenAI', title: 'Azure OpenAI' },
  { id: 'N64', label: 'Alibaba DashScope', title: 'Alibaba DashScope' },
  {
    id: 'N65',
    label: 'Kaggle / Colab',
    title: 'Kaggle / Colab + Compare',
  },
];

const VIZ = {
  orange: '#F59E0B',
  blue: '#378ADD',
  indigo: '#6366F1',
  red: '#E24B4A',
  green: '#1D9E75',
  cyan: '#06B6D4',
  amber: '#FAC775',
  grey: '#9CA3AF',
} as const;

const VENDOR_COLOR: Record<string, string> = {
  orange: VIZ.orange,
  blue: VIZ.blue,
  indigo: VIZ.indigo,
  red: VIZ.red,
  green: VIZ.green,
  cyan: VIZ.cyan,
};

const API = 'http://localhost:8000';

export default function Day13Page() {
  const [activeId, setActiveId] = useState('N61');
  const [provider, setProvider] = useState('openai');
  const progress = useNodeProgress(13);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 13 · Cloud AI Platforms
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
          The <span className="text-accent">managed layer</span> above the
          providers.
        </h1>
        <p className="text-sm text-muted">
          AWS Bedrock, GCP Vertex AI, Azure OpenAI, Alibaba DashScope,
          Kaggle, Colab &mdash; how each one rewraps the same underlying
          models for different buyers. Each tab is N61&ndash;N65.
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

      <div className={activeId === 'N61' ? undefined : 'hidden'}>
        <NodeBedrock provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N62' ? undefined : 'hidden'}>
        <NodeVertex provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N63' ? undefined : 'hidden'}>
        <NodeAzure provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N64' ? undefined : 'hidden'}>
        <NodeDashScope provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N65' ? undefined : 'hidden'}>
        <NodeNotebooks provider={provider} setProvider={setProvider} />
      </div>
      <DayPager day={13} advanced />
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
      const r = await fetch(`${API}/day13/ask`, {
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
        <textarea aria-label="Form input"
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

// ─── N61 — AWS Bedrock ───────────────────────────────────────────

function NodeBedrock({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="AWS Bedrock"
        hint="Amazon's managed model zoo. One API in front of Claude, Llama, Titan, Mistral, Cohere, and more &mdash; with AWS IAM, VPC endpoints, and CloudWatch wrapped around them."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Multi-model"
          body="One endpoint serves Claude (Anthropic), Llama (Meta), Titan (Amazon), Mistral, Cohere. You pick the model per request via the model ID; auth + billing stay the same."
          color={VIZ.orange}
        />
        <FactCard
          tag="IAM-native"
          body="All access goes through IAM roles + policies. No separate API keys to rotate — the same access model AWS already enforces on S3, Lambda, etc."
          color={VIZ.orange}
        />
        <FactCard
          tag="Knowledge bases"
          body="Managed RAG: point Bedrock at an S3 bucket and it handles chunking + embedding + retrieval. Great if your data already lives in AWS."
          color={VIZ.orange}
        />
        <FactCard
          tag="Provisioned throughput"
          body="On-demand pricing per token, or pre-purchase dedicated capacity (provisioned throughput) for steady high-QPS workloads. The escape valve when you outgrow pay-per-call."
          color={VIZ.orange}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.orange}
        presets={[
          'When does AWS Bedrock beat calling Anthropic / OpenAI directly?',
          'How does Bedrock pricing actually work?',
          'What does a Bedrock knowledge base do that I would otherwise build myself?',
        ]}
        defaultQuestion="What is AWS Bedrock and when should I use it?"
      />
      <ExplainerBlock
        title="The AWS-native default"
        body="If your stack already lives on AWS &mdash; VPCs, IAM, CloudWatch, S3 RAG data &mdash; Bedrock is the path of least resistance. You trade some model-picking flexibility (Bedrock lags a few weeks behind Anthropic / Meta releases) for stack consistency, compliance posture, and one consolidated bill. Outside AWS, it's almost never worth the wrapper overhead vs going to the provider directly."
      />
    </div>
  );
}

// ─── N62 — GCP Vertex AI ─────────────────────────────────────────

function NodeVertex({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="GCP Vertex AI"
        hint="Google's end-to-end MLOps platform. Vertex is less of a model zoo and more of a lifecycle &mdash; Data &rarr; Train &rarr; Evaluate &rarr; Deploy &rarr; Monitor &rarr; back to Data."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Gemini, first-class"
          body="Gemini 2.x models are native to Vertex. Free tier covers 15 requests/minute and ~1M tokens/day &mdash; enough for real prototypes, not just demos."
          color={VIZ.blue}
        />
        <FactCard
          tag="Full MLOps surface"
          body="Vertex Pipelines (orchestration), Feature Store, Experiments, Model Registry, Endpoints, Monitoring. The same console handles 'train a CNN' and 'serve Gemini' end to end."
          color={VIZ.blue}
        />
        <FactCard
          tag="TPU access"
          body="Cloud TPUs (v4, v5e, v5p) are reachable from Vertex. Real cost win for big training jobs if your model is XLA-friendly."
          color={VIZ.blue}
        />
        <FactCard
          tag="BigQuery integration"
          body="ML.GENERATE_TEXT inside SQL queries against BigQuery. Embeddings + predictions joined right next to your warehouse without ETLing to the model."
          color={VIZ.blue}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.blue}
        presets={[
          'How is Vertex AI different from just calling the Gemini API?',
          'What is in the Vertex MLOps lifecycle?',
          'When does TPU on Vertex beat GPU on AWS?',
        ]}
        defaultQuestion="What does Vertex AI give me beyond a Gemini API call?"
      />
      <ExplainerBlock
        title="The lifecycle bet"
        body="Vertex's pitch isn't 'we have the best models' &mdash; it's 'we have every stage of the ML lifecycle in one console'. That matters most for teams shipping their own models (or fine-tunes), not just calling foundation models. For pure prompt-engineering teams, the simpler Gemini API + Cloud Run is usually enough; reach for Vertex when you're doing actual MLOps."
      />
    </div>
  );
}

// ─── N63 — Azure OpenAI ──────────────────────────────────────────

function NodeAzure({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Azure OpenAI"
        hint="Same OpenAI models (GPT-4o, GPT-4o-mini, etc.), wrapped in Microsoft's enterprise envelope. Same SDK, different base URL + auth + compliance + region story."
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div
          className="space-y-2 border bg-paper p-3"
          style={{ borderLeft: `2px solid ${VIZ.grey}` }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.grey }}
          >
            api.openai.com (direct)
          </div>
          <ul className="space-y-1 text-[12px] leading-snug text-foreground/80">
            <li>Base URL: api.openai.com/v1</li>
            <li>Auth: bearer key (sk-…)</li>
            <li>Data residency: US, mostly</li>
            <li>Compliance: SOC2 only</li>
            <li>Billing: OpenAI invoice</li>
          </ul>
        </div>
        <div
          className="space-y-2 border bg-paper p-3"
          style={{ borderLeft: `2px solid ${VIZ.indigo}` }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.indigo }}
          >
            Azure OpenAI Service
          </div>
          <ul className="space-y-1 text-[12px] leading-snug text-foreground/80">
            <li>Base URL: <code>{`{deployment}.openai.azure.com`}</code></li>
            <li>Auth: Azure AD / Entra (or API key)</li>
            <li>Data residency: pick any Azure region</li>
            <li>Compliance: SOC2, HIPAA, FedRAMP, GDPR</li>
            <li>Billing: Azure subscription</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Deployments"
          body="You don't call gpt-4o directly &mdash; you 'deploy' it under a name you choose. Lets you A/B between model versions without changing client code."
          color={VIZ.indigo}
        />
        <FactCard
          tag="Lagging by ~weeks"
          body="New OpenAI models hit api.openai.com first, Azure a few weeks later. The lag is the cost of the enterprise wrapper."
          color={VIZ.indigo}
        />
        <FactCard
          tag="Content filters"
          body="Azure injects its own moderation layer. Useful for enterprises that need a documented safety filter; sometimes annoying if it triggers on legitimate content."
          color={VIZ.indigo}
        />
        <FactCard
          tag="Provisioned Throughput Units"
          body="PTUs reserve dedicated capacity at flat monthly cost. The enterprise alternative to pay-as-you-go when you need predictable latency at scale."
          color={VIZ.indigo}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.indigo}
        presets={[
          'When does Azure OpenAI beat calling OpenAI directly?',
          'What is an Azure OpenAI deployment?',
          'Why does Azure OpenAI lag the OpenAI public release?',
        ]}
        defaultQuestion="Same models, different bill — what does Azure OpenAI actually add?"
      />
      <ExplainerBlock
        title="The compliance wrapper"
        body="If your procurement team has heard of OpenAI but only buys things through their Microsoft EA, Azure OpenAI is the line item that gets signed. You're paying for the legal + compliance + regional posture, not for the models &mdash; they're the same GPT-4o-mini you'd hit on api.openai.com. For startups, it's usually overhead; for regulated industries, it's the only path."
      />
    </div>
  );
}

// ─── N64 — Alibaba DashScope ─────────────────────────────────────

function NodeDashScope({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Alibaba DashScope"
        hint="Alibaba's model platform. Hosts the Qwen family (Qwen 2.5, Qwen-Coder, Qwen-VL) plus partner models. The cheapest tier in this lineup, with strong Chinese + SEA language coverage."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Qwen family"
          body="Qwen-Turbo (cheap), Qwen-Plus (balanced), Qwen-Max (frontier). Plus Qwen-Coder for code, Qwen-VL for vision, Qwen-Audio for speech. All on one auth."
          color={VIZ.red}
        />
        <FactCard
          tag="OpenAI-compatible"
          body="Same chat-completions endpoint shape as OpenAI. Set base_url to https://dashscope.aliyuncs.com/compatible-mode/v1, swap the API key, and your existing SDK code just works."
          color={VIZ.red}
        />
        <FactCard
          tag="EN + ZH + ID"
          body="Trained heavily on Chinese + English + multilingual SEA data. Often the best price-per-quality option for Indonesian, Vietnamese, Thai, etc. &mdash; cheaper than GPT-4o-mini, often comparable quality."
          color={VIZ.red}
        />
        <FactCard
          tag="Free trial quota"
          body="New accounts get a 1M-token credit good for 6 months on Qwen-Turbo / Plus. Enough to evaluate without putting in a card."
          color={VIZ.red}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.red}
        presets={[
          'When does Alibaba DashScope beat OpenAI on price?',
          'How does Qwen quality compare to GPT-4o-mini in 2026?',
          'Is DashScope safe to use from outside China?',
        ]}
        defaultQuestion="What is Alibaba DashScope and which Qwen model should I start with?"
      />
      <ExplainerBlock
        title="The price + multilingual play"
        body="DashScope is rarely the first cloud people reach for &mdash; until they look at the pricing page. Qwen-Turbo is one of the cheapest serious chat models in 2026, and it speaks Indonesian, Vietnamese, and Thai better than most Western options thanks to Alibaba's regional training data. The OpenAI-compatible endpoint makes it a one-line swap to try. The catch is geopolitical and data-residency considerations &mdash; figure out where your data goes before you ship."
      />
    </div>
  );
}

// ─── N65 — Kaggle / Colab + Compare + Try-it-yourself ────────────

function NodeNotebooks({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Kaggle / Colab — free GPUs"
        hint="The 'I don't want to pay for a GPU yet' option. Kaggle gives 30 hrs/week of T4 free; Colab gives a session-limited T4 free + Pro tiers for more. Best for learning, fine-tuning experiments, and quick demos."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Kaggle T4 (free)"
          body="30 hours per week of NVIDIA T4 (16 GB VRAM), no credit card. Persistent /kaggle/working storage between runs. Great for QLoRA fine-tunes."
          color={VIZ.cyan}
        />
        <FactCard
          tag="Colab Free"
          body="One T4 GPU per session, ~12 hour cap, no guaranteed availability. Storage resets when the runtime disconnects. Quick and dirty."
          color={VIZ.green}
        />
        <FactCard
          tag="Colab Pro tiers"
          body="$9.99/mo for priority access + longer sessions. $49.99/mo gets you A100 / L4 GPUs on a compute-unit budget. Cheaper than renting A100 on AWS for short bursts."
          color={VIZ.green}
        />
        <FactCard
          tag="When to graduate"
          body="When your fine-tune takes more than ~6 hours, when you need a persistent endpoint, or when free quota runs out. Move to a real cloud (Vertex, Bedrock) or rent a vast.ai / Lambda Labs GPU."
          color={VIZ.cyan}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.cyan}
        presets={[
          'When is Kaggle better than Colab for fine-tuning?',
          'What is the cheapest path to a free A100?',
          'When should I stop using free notebooks and pay for compute?',
        ]}
        defaultQuestion="Can I really fine-tune a model on a free GPU? What is the catch?"
      />

      <PlatformComparePanel provider={provider} setProvider={setProvider} />
      <DashboardLauncher />
      <PricingReference />

      <ExplainerBlock
        title="Free until it isn't"
        body="The Kaggle + Colab combo gets you through almost the entire learning phase &mdash; embeddings, RAG demos, QLoRA fine-tunes &mdash; without spending a dollar. They are not, however, where you ship. The moment you need a persistent endpoint, a longer training run, or guaranteed GPU availability, you graduate to one of the four real clouds above. Knowing which one to graduate to is the actual job of this day."
      />
    </div>
  );
}

// ─── Platform comparison (lives inside N65) ──────────────────────

type Platform = {
  name: string;
  vendor: string;
  vendor_color: string;
  managed: boolean;
  free_tier: boolean;
  openai_compatible: boolean;
  compliance: string[];
  best_for: string;
  pricing_model: string;
};

type CompareResponse = {
  platforms: Platform[];
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

function PlatformComparePanel({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day13/platform-compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
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
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">
            Compare all six platforms
          </h3>
          <p className="mt-1 text-sm text-muted">
            Ask the model to rate each platform on managed / free-tier /
            OpenAI-compatible / compliance / pricing. Renders a card grid
            and a feature matrix.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ModelSwitcher
            selected={provider}
            onChange={setProvider}
            disabled={loading}
          />
          <button
            onClick={run}
            disabled={loading}
            className="border border-foreground bg-foreground px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-background transition hover:bg-accent hover:border-accent disabled:opacity-40"
          >
            {loading ? 'comparing…' : 'Compare platforms →'}
          </button>
        </div>
      </div>

      <div
        className="border-l-2 bg-paper px-4 py-3 text-sm"
        style={{
          borderColor: VIZ.amber,
          color: '#f4c98a',
          background: 'rgba(250, 199, 117, 0.08)',
        }}
      >
        Note: this day teaches cloud platforms as concepts. The Ask above
        is answered by your selected provider (OpenAI / Groq / DeepSeek /
        Gemini) — not by Bedrock / Vertex / etc. themselves.
      </div>

      {error && <ErrorBox message={error} />}

      {result && <PlatformCardGrid platforms={result.platforms} />}
      {result && <PlatformMatrix platforms={result.platforms} />}

      {result && (
        <Footer>
          {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
          {result.latency_ms}ms
        </Footer>
      )}
    </div>
  );
}

function PlatformCardGrid({ platforms }: { platforms: Platform[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {platforms.map((p) => {
        const color = VENDOR_COLOR[p.vendor_color] ?? VIZ.grey;
        return (
          <div
            key={p.name}
            className="flex flex-col gap-2 border border-rule bg-paper"
          >
            <div
              className="h-1 w-full"
              style={{ background: color }}
              aria-hidden
            />
            <div className="space-y-2 px-3 pb-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-serif text-lg font-semibold">{p.name}</h4>
                <span
                  className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                  style={{
                    borderColor: color,
                    color,
                    background: `${color}1F`,
                  }}
                >
                  {p.vendor || '—'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <Pill ok={p.managed} label="managed" />
                <Pill ok={p.free_tier} label="free tier" />
                <Pill ok={p.openai_compatible} label="openai-api" />
                <span
                  className="border border-rule px-1.5 py-0.5 font-mono uppercase tracking-wide text-foreground/70"
                >
                  {p.pricing_model}
                </span>
              </div>
              <p className="text-[13px] italic leading-relaxed text-foreground/70">
                {p.best_for}
              </p>
              {p.compliance.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {p.compliance.map((c) => (
                    <span
                      key={c}
                      className="border border-rule bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/60"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="border px-1.5 py-0.5 font-mono uppercase tracking-wide"
      style={{
        borderColor: ok ? VIZ.green : 'var(--rule)',
        color: ok ? VIZ.green : '#9CA3AF',
        background: ok ? `${VIZ.green}1F` : 'transparent',
      }}
    >
      {ok ? '✓' : '✗'} {label}
    </span>
  );
}

function PlatformMatrix({ platforms }: { platforms: Platform[] }) {
  return (
    <div className="overflow-x-auto border border-rule bg-paper">
      <table className="w-full border-collapse text-[13px]">
        <thead className="sticky top-0 bg-paper/95">
          <tr>
            <Th>Platform</Th>
            <Th center>Managed</Th>
            <Th center>Free tier</Th>
            <Th center>OpenAI-compatible</Th>
            <Th>Compliance</Th>
            <Th>Pricing</Th>
            <Th>Best for</Th>
          </tr>
        </thead>
        <tbody>
          {platforms.map((p) => {
            const color = VENDOR_COLOR[p.vendor_color] ?? VIZ.grey;
            return (
              <tr
                key={p.name}
                className="border-t border-rule align-top"
              >
                <td
                  className="px-3 py-2 font-mono text-[12px]"
                  style={{ color }}
                >
                  {p.name}
                </td>
                <Td center>
                  <Check on={p.managed} />
                </Td>
                <Td center>
                  <Check on={p.free_tier} />
                </Td>
                <Td center>
                  <Check on={p.openai_compatible} />
                </Td>
                <Td>
                  {p.compliance.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.compliance.map((c) => (
                        <span
                          key={c}
                          className="border border-rule bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/60"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="font-mono text-[11px] text-muted">
                      —
                    </span>
                  )}
                </Td>
                <Td>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-foreground/80">
                    {p.pricing_model}
                  </span>
                </Td>
                <Td>{p.best_for}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <th
      className={[
        'border-b border-rule px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted',
        center ? 'text-center' : 'text-left',
      ].join(' ')}
    >
      {children}
    </th>
  );
}

function Td({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <td
      className={[
        'px-3 py-2 text-foreground/85',
        center ? 'text-center' : 'text-left',
      ].join(' ')}
    >
      {children}
    </td>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      aria-label={on ? 'yes' : 'no'}
      style={{ color: on ? VIZ.green : '#9CA3AF' }}
      className="font-mono text-[13px]"
    >
      {on ? '✓' : '✗'}
    </span>
  );
}

// ─── Hardcoded dashboard launcher ────────────────────────────────

type LaunchCard = {
  name: string;
  vendor_color: string;
  lowest_entry: string;
  steps: string[];
  cost_badge: string;
  cost_tone: 'free' | 'cheap' | 'variable';
  dashboard_url: string;
};

const LAUNCH_CARDS: LaunchCard[] = [
  {
    name: 'AWS Bedrock',
    vendor_color: 'orange',
    lowest_entry: 'us-east-1 · amazon.titan-text-lite-v1 · ~$0.0003/1K tokens',
    steps: [
      'Sign in to AWS Console → search Bedrock',
      'Go to Model access → enable Titan Text Lite (free to request)',
      'Open Playgrounds → Chat → pick Titan Text Lite',
    ],
    cost_badge: '~$0.30/1M tokens',
    cost_tone: 'cheap',
    dashboard_url: 'https://console.aws.amazon.com/bedrock',
  },
  {
    name: 'GCP Vertex AI',
    vendor_color: 'blue',
    lowest_entry: 'gemini-2.0-flash · free tier up to 15 req/min',
    steps: [
      'Go to console.cloud.google.com → enable Vertex AI API',
      'Open Vertex AI Studio → pick Gemini 2.0 Flash',
      'Free tier: 15 RPM, 1M tokens/day at no cost',
    ],
    cost_badge: 'Free tier available',
    cost_tone: 'free',
    dashboard_url: 'https://console.cloud.google.com/vertex-ai',
  },
  {
    name: 'Azure OpenAI',
    vendor_color: 'indigo',
    lowest_entry: 'gpt-4o-mini · $0.15/1M input tokens',
    steps: [
      'Go to portal.azure.com → create Azure OpenAI resource',
      'Open Azure OpenAI Studio → Deployments → deploy gpt-4o-mini',
      'Use Chat playground or copy the endpoint to your code',
    ],
    cost_badge: '$0.15/1M input',
    cost_tone: 'cheap',
    dashboard_url:
      'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub',
  },
  {
    name: 'Alibaba DashScope',
    vendor_color: 'red',
    lowest_entry: 'qwen-turbo · ~$0.001/1K tokens · free trial quota',
    steps: [
      'Sign up at dashscope.aliyun.com (international account works)',
      'Go to API-KEY management → create a key',
      'Use qwen-turbo — cheapest Qwen model, OpenAI-compatible API',
    ],
    cost_badge: 'Free trial + ~$0.001/1K',
    cost_tone: 'cheap',
    dashboard_url: 'https://dashscope.aliyun.com',
  },
  {
    name: 'Kaggle',
    vendor_color: 'cyan',
    lowest_entry: 'T4 GPU · 30 hrs/week free · zero signup cost',
    steps: [
      'Sign in at kaggle.com → New Notebook',
      'Settings → Accelerator → GPU T4 x2',
      'Run any HuggingFace model or Ollama inside the notebook',
    ],
    cost_badge: '100% Free',
    cost_tone: 'free',
    dashboard_url: 'https://www.kaggle.com/code',
  },
  {
    name: 'Google Colab',
    vendor_color: 'green',
    lowest_entry: 'T4 GPU · free tier · Colab Pro = $9.99/mo for more',
    steps: [
      'Go to colab.research.google.com → New notebook',
      'Runtime → Change runtime type → T4 GPU',
      'pip install any ML library — environment resets each session',
    ],
    cost_badge: 'Free / $9.99 Pro',
    cost_tone: 'variable',
    dashboard_url: 'https://colab.research.google.com',
  },
];

const COST_TONE: Record<LaunchCard['cost_tone'], { bg: string; fg: string }> = {
  free: { bg: `${VIZ.green}24`, fg: VIZ.green },
  cheap: { bg: `${VIZ.amber}24`, fg: VIZ.amber },
  variable: { bg: 'rgba(156,163,175,0.15)', fg: VIZ.grey },
};

function DashboardLauncher() {
  return (
    <div className="space-y-3 border-t border-rule pt-6">
      <div>
        <h3 className="font-serif text-xl font-semibold">
          Try it yourself &mdash; go to the dashboard
        </h3>
        <p className="text-sm text-muted">
          Each provider below has a free tier or lowest-cost entry point.
          Click to open the dashboard in a new tab.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {LAUNCH_CARDS.map((c) => {
          const color = VENDOR_COLOR[c.vendor_color] ?? VIZ.grey;
          const tone = COST_TONE[c.cost_tone];
          return (
            <div
              key={c.name}
              className="flex flex-col gap-2 border bg-paper p-3 transition hover:-translate-y-0.5"
              style={{ borderLeft: `2px solid ${color}` }}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center font-mono text-[12px]"
                  style={{
                    background: `${color}1F`,
                    color,
                    border: `1px solid ${color}`,
                  }}
                  aria-hidden
                >
                  {c.name.charAt(0)}
                </span>
                <h4 className="font-serif text-lg font-semibold">{c.name}</h4>
              </div>
              <div
                className="border-l-2 px-2 py-1 text-[12px] leading-relaxed text-foreground/80"
                style={{ borderColor: color, background: `${color}0A` }}
              >
                <span
                  className="mr-1 font-mono text-[9px] uppercase tracking-wide"
                  style={{ color }}
                >
                  lowest entry
                </span>
                {c.lowest_entry}
              </div>
              <ol className="ml-4 list-decimal space-y-0.5 text-[12px] text-foreground/80 marker:text-muted">
                {c.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span
                  className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                  style={{
                    borderColor: tone.fg,
                    color: tone.fg,
                    background: tone.bg,
                  }}
                >
                  {c.cost_badge}
                </span>
                <a
                  href={c.dashboard_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] uppercase tracking-wide transition hover:underline"
                  style={{ color }}
                >
                  Open dashboard →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hardcoded pricing reference (always at bottom of N65) ───────

const PRICING_ROWS: {
  provider: string;
  model: string;
  input: string;
  output: string;
  free: string;
  free_ok: boolean;
}[] = [
  {
    provider: 'Kaggle',
    model: 'T4 GPU notebook',
    input: 'Free',
    output: 'Free',
    free: '✓ 30h/week',
    free_ok: true,
  },
  {
    provider: 'Google Colab',
    model: 'T4 GPU notebook',
    input: 'Free',
    output: 'Free',
    free: '✓ limited',
    free_ok: true,
  },
  {
    provider: 'GCP Vertex AI',
    model: 'gemini-2.0-flash',
    input: 'Free',
    output: 'Free',
    free: '✓ 1M tok/day',
    free_ok: true,
  },
  {
    provider: 'Alibaba',
    model: 'qwen-turbo',
    input: '~$0.001/1K',
    output: '~$0.001/1K',
    free: '✓ trial quota',
    free_ok: true,
  },
  {
    provider: 'AWS Bedrock',
    model: 'titan-text-lite',
    input: '$0.0003/1K',
    output: '$0.0004/1K',
    free: '✗',
    free_ok: false,
  },
  {
    provider: 'Azure OpenAI',
    model: 'gpt-4o-mini',
    input: '$0.00015/1K',
    output: '$0.0006/1K',
    free: '✗',
    free_ok: false,
  },
];

function PricingReference() {
  return (
    <div className="space-y-2 border-t border-rule pt-6">
      <h3 className="font-serif text-xl font-semibold">
        Cost quick reference (cheapest first)
      </h3>
      <div className="overflow-x-auto border border-rule bg-paper">
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-paper/60">
            <tr>
              <Th>Provider</Th>
              <Th>Cheapest model</Th>
              <Th>Input cost</Th>
              <Th>Output cost</Th>
              <Th>Free tier</Th>
            </tr>
          </thead>
          <tbody>
            {PRICING_ROWS.map((row) => (
              <tr
                key={row.provider + row.model}
                className="border-t border-rule align-top"
              >
                <td className="px-3 py-2 font-mono text-[12px] text-foreground/90">
                  {row.provider}
                </td>
                <td className="px-3 py-2 text-foreground/85">{row.model}</td>
                <td className="px-3 py-2 font-mono text-[12px] text-foreground/85">
                  {row.input}
                </td>
                <td className="px-3 py-2 font-mono text-[12px] text-foreground/85">
                  {row.output}
                </td>
                <td
                  className="px-3 py-2 font-mono text-[12px]"
                  style={{ color: row.free_ok ? VIZ.green : VIZ.grey }}
                >
                  {row.free}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wide text-muted">
        Prices as of mid-2025. Always check the provider pricing page before
        production use.
      </p>
    </div>
  );
}
