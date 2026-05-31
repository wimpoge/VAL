'use client';

import { useState } from 'react';
import ModelSwitcher from '../../components/ModelSwitcher';
import { Markdown } from '../../components/Markdown';
import { useNodeProgress } from '../../components/useNodeProgress';
import DayPager from '../../components/DayPager';

const NODES = [
  { id: 'N86', label: 'LoRA', title: 'Fine-tuning (LoRA / QLoRA)' },
  { id: 'N87', label: 'RLHF', title: 'RLHF' },
  { id: 'N88', label: 'DPO', title: 'DPO' },
  { id: 'N89', label: 'Alignment', title: 'Alignment & Safety' },
  { id: 'N90', label: 'Quantization', title: 'Quantization' },
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

export default function Day18Page() {
  const [activeId, setActiveId] = useState('N86');
  const [provider, setProvider] = useState('openai');
  const progress = useNodeProgress(18);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 18 · Advanced AI Topics
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
          The techniques that{' '}
          <span className="text-accent">shaped every model</span> above.
        </h1>
        <p className="text-sm text-muted">
          Fine-tuning with LoRA / QLoRA, RLHF, DPO, alignment, quantization
          &mdash; with a live concept explainer that breaks each one into
          numbered steps. N86&ndash;N90.
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

      <div className={activeId === 'N86' ? undefined : 'hidden'}>
        <NodeLoRA provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N87' ? undefined : 'hidden'}>
        <NodeRLHF provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N88' ? undefined : 'hidden'}>
        <NodeDPO provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N89' ? undefined : 'hidden'}>
        <NodeAlignment provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N90' ? undefined : 'hidden'}>
        <NodeQuantization provider={provider} setProvider={setProvider} />
      </div>

      <ConceptDeepDiveSection provider={provider} setProvider={setProvider} />

      <DayPager day={18} advanced />

      <style jsx global>{`
        @keyframes stepFadeIn {
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
      const r = await fetch(`${API}/day18/ask`, {
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

// ─── N86 — LoRA / QLoRA + Full-vs-LoRA visual ────────────────────

function NodeLoRA({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Fine-tuning (LoRA / QLoRA)"
        hint="The technique that turns a $50k GPU-day fine-tune into a $10 one. Freeze the base model; inject a pair of small low-rank matrices A·B per attention layer; only train those. QLoRA stacks 4-bit quantization on top so a 7B model fits on a 12 GB consumer GPU."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="A·B low-rank pair"
          body="Each frozen weight W gets a learned offset W' = W + α·(A·B), where A is d×r and B is r×d for some small rank r (4-16). The product A·B has rank r — much smaller than the full d×d update."
          color={VIZ.violet}
        />
        <FactCard
          tag="~1% of parameters"
          body="A 7B model has ~7 billion weights. A typical LoRA at rank 8 trains ~70 million — 1% of the original. Same quality on the target task; 100x smaller checkpoint."
          color={VIZ.violet}
        />
        <FactCard
          tag="QLoRA = 4-bit base"
          body="The frozen base weights get quantized to NF4 (4-bit normal float). The adapters stay in BF16. A 7B model that needed 28 GB now fits in ~6 GB during training."
          color={VIZ.violet}
        />
        <FactCard
          tag="Adapters are swappable"
          body="One base model, many adapter sets. Hot-swap per request (legal-tone adapter, code-review adapter, customer-support adapter) — same GPU, different specialization."
          color={VIZ.violet}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.violet}
        presets={[
          'What does the rank r parameter actually control in LoRA?',
          'How does QLoRA fit a 7B model into 6 GB of VRAM?',
          'When should I LoRA-fine-tune instead of using RAG?',
        ]}
        defaultQuestion="What is LoRA and why is it so much cheaper than full fine-tuning?"
      />

      <LoRAvsFullVisual />

      <ExplainerBlock
        title="The cheap-fine-tune unlock"
        body="LoRA is what made &lsquo;fine-tune your own model&rsquo; a real option for people without a Saudi-funded GPU cluster. The two assumptions that make it work: (1) the useful updates to a pretrained model live in a low-rank subspace, so a rank-8 approximation captures almost everything, and (2) you can keep the base model frozen and just add the offset. QLoRA adds the third trick &mdash; quantize the frozen base to 4-bit since you&apos;re not updating it anyway. Stacked, you get from $50k full fine-tune down to $10 QLoRA on a consumer card."
      />
    </div>
  );
}

function LoRAvsFullVisual() {
  const [mode, setMode] = useState<'full' | 'lora'>('lora');
  const totalParams = 7_000_000_000;
  const loraParams = 70_000_000;
  const displayParams = mode === 'full' ? totalParams : loraParams;
  const layers = [0, 1, 2, 3, 4, 5];

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">
            Full fine-tune vs LoRA
          </h3>
          <p className="text-sm text-muted">
            Same six transformer layers in both stacks; only what&apos;s
            glowing actually updates during training.
          </p>
        </div>
        <div className="flex gap-2">
          {(['full', 'lora'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={[
                'border px-3 py-1 font-mono text-[10px] uppercase tracking-wide transition',
                mode === m
                  ? 'border-accent bg-accent text-background'
                  : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
              ].join(' ')}
            >
              {m === 'full' ? 'full fine-tune' : 'LoRA'}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-rule bg-paper p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <StackColumn
            label="Full fine-tune"
            sublabel="every weight updates"
            color={VIZ.blue}
            layers={layers}
            active={mode === 'full'}
            mode="full"
          />
          <StackColumn
            label="LoRA"
            sublabel="only A·B adapters update"
            color={VIZ.violet}
            layers={layers}
            active={mode === 'lora'}
            mode="lora"
          />
        </div>

        <div className="flex items-center justify-between border-t border-rule pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            trainable parameters
          </span>
          <span
            className="font-mono text-xl font-semibold transition-colors"
            style={{
              color: mode === 'full' ? VIZ.blue : VIZ.violet,
            }}
          >
            {displayParams.toLocaleString()}
            <span className="ml-2 text-xs text-muted">
              {mode === 'full' ? '100%' : '~1%'} of 7 B
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function StackColumn({
  label,
  sublabel,
  color,
  layers,
  active,
  mode,
}: {
  label: string;
  sublabel: string;
  color: string;
  layers: number[];
  active: boolean;
  mode: 'full' | 'lora';
}) {
  return (
    <div
      className="space-y-2 border bg-background p-3 transition"
      style={{
        borderTop: `2px solid ${color}`,
        opacity: active ? 1 : 0.55,
      }}
    >
      <div>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color }}
        >
          {label}
        </div>
        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          {sublabel}
        </p>
      </div>
      <div className="space-y-1.5">
        {layers.map((i) => {
          // For "full" mode every layer glows. For "lora" mode the layer
          // body is grey (frozen) and we render two tiny A/B chips on top.
          const layerColor = mode === 'full' ? color : VIZ.grey;
          return (
            <div key={i} className="relative">
              <div
                className="h-5 w-full"
                style={{
                  background: layerColor,
                  opacity: mode === 'full' ? 0.65 : 0.18,
                }}
              />
              {mode === 'lora' && (
                <div className="absolute inset-0 flex items-center justify-end gap-1 pr-2">
                  <span
                    className="border px-1 text-[9px] font-mono"
                    style={{
                      borderColor: color,
                      color,
                      background: `${color}33`,
                    }}
                  >
                    A
                  </span>
                  <span
                    className="border px-1 text-[9px] font-mono"
                    style={{
                      borderColor: color,
                      color,
                      background: `${color}33`,
                    }}
                  >
                    B
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── N87 — RLHF + 3-stage pipeline ───────────────────────────────

function NodeRLHF({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="RLHF — Reinforcement Learning from Human Feedback"
        hint="The recipe behind ChatGPT and every assistant after it. Three stages: supervised fine-tune on demonstrations, train a reward model on human preference pairs, then RL-fine-tune the model to maximize that reward with a KL penalty so it doesn't wander too far from the SFT base."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Stage 1 — SFT"
          body="Supervised fine-tune on (prompt, ideal-response) pairs hand-written by humans. Gets the model to produce coherent, helpful-shaped outputs before reward shaping starts."
          color={VIZ.blue}
        />
        <FactCard
          tag="Stage 2 — Reward model"
          body="Humans rank pairs (A is better than B for this prompt). Train a small classifier on these preferences to predict 'human-preferred-ness' as a scalar reward."
          color={VIZ.amber}
        />
        <FactCard
          tag="Stage 3 — PPO"
          body="Reinforcement-learn the policy to maximize the reward model's score. KL penalty against the SFT model prevents reward hacking by drifting too far."
          color={VIZ.green}
        />
        <FactCard
          tag="Why it works"
          body="Humans can't write a good reward function, but they can compare A vs B. RLHF converts that comparison data into a numeric signal RL can optimize against."
          color={VIZ.coral}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.amber}
        presets={[
          'Why is the KL penalty in PPO necessary?',
          'How are human preference pairs collected at scale?',
          'What goes wrong if you skip the SFT stage?',
        ]}
        defaultQuestion="What does the three-stage RLHF pipeline actually do?"
      />

      <RLHFPipelineVisual />

      <ExplainerBlock
        title="The pipeline that defined modern assistants"
        body="RLHF is the reason the first ChatGPT felt different from raw GPT-3. The base model has the knowledge; SFT teaches the format; the reward model + PPO teach the taste. The cost is real &mdash; tens of thousands of human-labeled preference pairs and a non-trivial RL training loop. That cost is why DPO (next tab) exists: most of the value, fewer moving parts."
      />
    </div>
  );
}

function RLHFPipelineVisual() {
  const [expanded, setExpanded] = useState<number | null>(0);

  const stages = [
    {
      name: 'Stage 1 · SFT',
      color: VIZ.blue,
      tag: 'supervised',
      input: '(prompt, ideal-response) pairs · hand-written',
      detail:
        "Standard cross-entropy fine-tune. Teaches the base model the 'helpful assistant' shape before any reward signal enters the picture. Usually ~10-50k examples.",
    },
    {
      name: 'Stage 2 · Reward model',
      color: VIZ.amber,
      tag: 'classifier',
      input: 'preference pairs · human says A > B',
      detail:
        "Train a small model on (prompt, response_A, response_B, A>B) tuples to predict which response a human will prefer. The trained classifier is the reward function for stage 3.",
    },
    {
      name: 'Stage 3 · PPO',
      color: VIZ.green,
      tag: 'RL loop',
      input: "policy = SFT · reward = stage 2 · constraint: KL(policy ‖ SFT) < ε",
      detail:
        "Proximal Policy Optimization rolls out completions, scores them with the reward model, and updates the policy. The KL penalty against the SFT model is the safety rail — it stops the policy from drifting into reward-hack territory.",
    },
  ];

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The three stages, end to end
        </h3>
        <p className="text-sm text-muted">
          Click a stage to expand it. The arrows show what each stage feeds
          into the next.
        </p>
      </div>

      <div className="border border-rule bg-paper p-4 space-y-3">
        {stages.map((s, i) => {
          const isOpen = expanded === i;
          return (
            <div key={i} className="space-y-2">
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full border bg-background p-3 text-left transition hover:border-foreground"
                style={{
                  borderLeft: `3px solid ${s.color}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div
                      className="font-mono text-[11px] uppercase tracking-[0.18em]"
                      style={{ color: s.color }}
                    >
                      {s.name}
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-muted">
                      {s.input}
                    </p>
                  </div>
                  <span
                    className="border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide"
                    style={{
                      borderColor: s.color,
                      color: s.color,
                      background: `${s.color}1F`,
                    }}
                  >
                    {s.tag}
                  </span>
                </div>
                {isOpen && (
                  <p className="mt-3 text-[12px] leading-relaxed text-foreground/85">
                    {s.detail}
                  </p>
                )}
              </button>
              {i < stages.length - 1 && (
                <div className="text-center font-mono text-[10px] text-muted">
                  ↓
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── N88 — DPO + RLHF-vs-DPO comparison ──────────────────────────

function NodeDPO({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="DPO — Direct Preference Optimization"
        hint="The 2023 paper that made RLHF feel optional for most teams. Skip the reward model, skip the PPO loop, optimize one closed-form loss directly on preference pairs. Same preference data; one training step instead of three; comparable quality on most benchmarks."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="One loss, no RL"
          body="DPO derives a loss that directly increases the model's likelihood of preferred responses relative to rejected ones, with the reference model baked into the formula. Standard gradient descent — no PPO."
          color={VIZ.green}
        />
        <FactCard
          tag="Same input data"
          body="Takes the same (prompt, chosen, rejected) tuples RLHF stage 2 collects. The data flywheel doesn't change; only the trainer does."
          color={VIZ.green}
        />
        <FactCard
          tag="β controls KL strength"
          body="The DPO loss has a temperature β that implicitly controls the KL penalty against the reference model. Higher β = stays closer to the reference; lower β = more aggressive shaping."
          color={VIZ.green}
        />
        <FactCard
          tag="When RLHF still wins"
          body="DPO is offline (fixed preference dataset). When you need to keep collecting fresh preferences and shaping live, an online RL loop with a reward model is still useful."
          color={VIZ.green}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.green}
        presets={[
          'How does the DPO loss work mathematically?',
          'Does DPO produce different quality than RLHF in practice?',
          'When would I still pick RLHF over DPO?',
        ]}
        defaultQuestion="What is DPO and what does it skip from RLHF?"
      />

      <RLHFvsDPOVisual />

      <ExplainerBlock
        title="The simpler-is-better moment"
        body="DPO is the textbook case of theory catching up to practice. RLHF&apos;s three-stage pipeline was built when nobody had a clean derivation of a preference-optimization loss; everyone reached for RL because RL is what we know how to do with reward functions. DPO showed you could integrate the reward function analytically into the loss, removing the need for an explicit reward model and the PPO loop entirely. The result: most teams that picked DPO in 2024 got 80% of RLHF&apos;s benefit at 20% of the complexity. RLHF stays relevant for online learning and certain alignment regimes."
      />
    </div>
  );
}

function RLHFvsDPOVisual() {
  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          RLHF vs DPO &mdash; same data, different machinery
        </h3>
        <p className="text-sm text-muted">
          Both columns start from the same preference dataset. RLHF takes a
          detour through a reward model and PPO; DPO goes straight to the
          loss.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ComparisonStack
          title="RLHF"
          complexity="high"
          color={VIZ.amber}
          boxes={[
            { label: 'Preference pairs', mono: false, color: VIZ.coral },
            { label: 'Train reward model', mono: true, color: VIZ.amber },
            { label: 'PPO loop + KL penalty', mono: true, color: VIZ.blue },
            { label: 'Aligned model', mono: false, color: VIZ.green },
          ]}
        />
        <ComparisonStack
          title="DPO"
          complexity="medium"
          color={VIZ.green}
          boxes={[
            { label: 'Preference pairs', mono: false, color: VIZ.coral },
            { label: 'DPO loss · single step', mono: true, color: VIZ.green },
            { label: 'Aligned model', mono: false, color: VIZ.green },
          ]}
        />
      </div>
    </div>
  );
}

const COMPLEXITY_COLOR: Record<'medium' | 'high', string> = {
  medium: VIZ.amber,
  high: VIZ.red,
};

function ComparisonStack({
  title,
  complexity,
  color,
  boxes,
}: {
  title: string;
  complexity: 'medium' | 'high';
  color: string;
  boxes: { label: string; mono: boolean; color: string }[];
}) {
  return (
    <div
      className="space-y-3 border bg-paper p-4"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div className="flex items-center justify-between">
        <h4
          className="font-serif text-lg font-semibold"
          style={{ color }}
        >
          {title}
        </h4>
        <span
          className="border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide"
          style={{
            borderColor: COMPLEXITY_COLOR[complexity],
            color: COMPLEXITY_COLOR[complexity],
            background: `${COMPLEXITY_COLOR[complexity]}1F`,
          }}
        >
          {complexity} complexity
        </span>
      </div>
      <div className="space-y-1.5">
        {boxes.map((b, i) => (
          <div key={i} className="space-y-1">
            <div
              className={[
                'border bg-background px-3 py-1.5 text-center text-[12px]',
                b.mono ? 'font-mono text-[11px]' : '',
              ].join(' ')}
              style={{ borderLeft: `2px solid ${b.color}` }}
            >
              {b.label}
            </div>
            {i < boxes.length - 1 && (
              <div className="text-center font-mono text-[10px] text-muted">
                ↓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── N89 — Alignment & Safety ────────────────────────────────────

function NodeAlignment({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI Alignment & Safety"
        hint="The branch of the field worried about models that are competent but misaligned. Reward hacking is the canonical failure mode: optimize for the metric, find a shortcut that satisfies the metric but defeats the intent. Constitutional AI is one practical defense — make the model critique and revise its own outputs."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Reward hacking"
          body="A boat-racing RL agent that learned to spin in circles collecting respawn power-ups instead of finishing the race. The reward function said 'score high'; the agent obliged. Same failure mode appears in LLMs."
          color={VIZ.red}
        />
        <FactCard
          tag="Specification gaming"
          body="The model satisfies the literal prompt while violating the intent. 'Summarize this' → 'Here is a summary.' The signal is correct; the behavior is useless. RLHF can amplify this if humans don't catch it."
          color={VIZ.red}
        />
        <FactCard
          tag="Constitutional AI"
          body="Two-pass loop: model generates a response, then critiques itself against a written 'constitution' (don't be deceptive, don't help build weapons, etc.), then revises. Used in Claude training to reduce harmful outputs."
          color={VIZ.violet}
        />
        <FactCard
          tag="RLHF ≠ alignment"
          body="RLHF optimizes for human-preferred-ness, which correlates with — but isn't — alignment. A model that sounds great while subtly lying scores high on RLHF and low on actual safety. The field is still figuring this out."
          color={VIZ.amber}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.violet}
        presets={[
          'What is reward hacking and what is the classic example?',
          'How does Constitutional AI differ from RLHF?',
          'Why is RLHF necessary but not sufficient for alignment?',
        ]}
        defaultQuestion="What does AI alignment actually mean and where does it differ from safety?"
      />

      <AlignmentVisual />

      <ExplainerBlock
        title="The two failure modes worth memorizing"
        body="Reward hacking (the agent finds a glitch that satisfies the metric while bypassing the intent) and specification gaming (the agent satisfies the literal prompt while ignoring the goal). Both are general properties of optimization, not LLM-specific. Constitutional AI is a current best practice: bake a written set of principles into the training loop so the model self-corrects against them. It&apos;s a partial defense, not a guarantee &mdash; the field still treats this as an open problem."
      />
    </div>
  );
}

function AlignmentVisual() {
  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The shortcut vs the safety rail
        </h3>
        <p className="text-sm text-muted">
          Left: the reward hacking shape. Right: Constitutional AI&apos;s
          critique-and-revise pattern.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <RewardHackingPanel />
        <ConstitutionalAIPanel />
      </div>
    </div>
  );
}

function RewardHackingPanel() {
  return (
    <div
      className="space-y-3 border bg-paper p-4"
      style={{ borderTop: `2px solid ${VIZ.red}` }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: VIZ.red }}
      >
        Reward hacking
      </div>
      <svg viewBox="0 0 200 90" className="w-full">
        <defs>
          <marker
            id="rh-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={VIZ.grey} />
          </marker>
          <marker
            id="rh-arrow-red"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={VIZ.red} />
          </marker>
        </defs>
        <text x="10" y="20" fontSize="8" fill={VIZ.grey} fontFamily="monospace">
          start
        </text>
        <circle cx="20" cy="35" r="4" fill={VIZ.grey} />
        <text x="160" y="20" fontSize="8" fill={VIZ.green} fontFamily="monospace">
          goal
        </text>
        <circle cx="180" cy="35" r="4" fill={VIZ.green} />
        <path
          d="M 25 38 Q 100 80 175 38"
          fill="none"
          stroke={VIZ.grey}
          strokeWidth="0.8"
          strokeDasharray="3 2"
          markerEnd="url(#rh-arrow)"
        />
        <text
          x="100"
          y="78"
          fontSize="7"
          fill={VIZ.grey}
          fontFamily="monospace"
          textAnchor="middle"
        >
          intended path
        </text>
        <path
          d="M 25 35 Q 60 5 95 25 Q 130 50 70 60 Q 30 50 25 35"
          fill="none"
          stroke={VIZ.red}
          strokeWidth="1.2"
          markerEnd="url(#rh-arrow-red)"
        />
        <text
          x="100"
          y="20"
          fontSize="7"
          fill={VIZ.red}
          fontFamily="monospace"
          textAnchor="middle"
        >
          shortcut · reward = max
        </text>
      </svg>
      <p className="text-[11px] leading-snug text-foreground/80">
        Classic boat-race example: agent learned to loop infinitely on
        respawn power-ups instead of finishing the race. Reward = score; the
        agent maximized it without crossing the finish line.
      </p>
    </div>
  );
}

function ConstitutionalAIPanel() {
  return (
    <div
      className="space-y-3 border bg-paper p-4"
      style={{ borderTop: `2px solid ${VIZ.violet}` }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: VIZ.violet }}
      >
        Constitutional AI
      </div>
      <div className="space-y-2">
        <CAIBox label="Initial response" color={VIZ.blue} />
        <div className="text-center font-mono text-[10px] text-muted">↓</div>
        <CAIBox
          label="Critique against principles"
          color={VIZ.amber}
          mono
        />
        <div className="text-center font-mono text-[10px] text-muted">↓</div>
        <CAIBox label="Revision" color={VIZ.violet} mono />
        <div className="text-center font-mono text-[10px] text-muted">↓</div>
        <CAIBox label="Final response" color={VIZ.green} />
      </div>
      <p className="text-[11px] leading-snug text-foreground/80">
        Same model wears two hats &mdash; first generator, then critic against a
        written constitution (&ldquo;don&apos;t be deceptive,&rdquo; etc.), then reviser.
        Reduces harmful outputs without needing as many human labels.
      </p>
    </div>
  );
}

function CAIBox({
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

// ─── N90 — Quantization + precision explorer ─────────────────────

function NodeQuantization({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Quantization & Model Compression"
        hint="Drop weights from 32-bit floats to 4-bit integers and the model gets ~8x smaller. With good quantization recipes (GPTQ, AWQ, GGUF Q4), it also stays nearly as accurate. This is what makes a 7B model fit on your laptop."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="The precision ladder"
          body="FP32 (32 bits) → BF16 (16 bits, training default) → INT8 (8 bits) → INT4 (4 bits). Each step halves memory; throughput goes up; quality drops a little until INT4 where the curve gets steep."
          color={VIZ.coral}
        />
        <FactCard
          tag="GPTQ vs AWQ vs GGUF"
          body="GPTQ: layer-wise calibration. AWQ: activation-aware, often higher quality at the same bit count. GGUF: the format llama.cpp uses, family of Q4_K_M etc. Pick by ecosystem first, quality second."
          color={VIZ.coral}
        />
        <FactCard
          tag="Calibration set matters"
          body="Quantizers fit themselves to a small dataset (1k samples). A calibration set that mismatches your real workload makes the model worse on real traffic — match the calibration to the domain."
          color={VIZ.coral}
        />
        <FactCard
          tag="Quant + LoRA combo"
          body="QLoRA = INT4 base + BF16 adapters. The bf16 adapters carry the trainable degrees of freedom; the int4 base saves the memory. Why a 7B model now trains on a $300 GPU."
          color={VIZ.coral}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.coral}
        presets={[
          'What is the difference between GPTQ and AWQ?',
          'How does GGUF Q4_K_M differ from straight INT4?',
          'When does quantization actually hurt model quality?',
        ]}
        defaultQuestion="What does quantization do to a model and what are the trade-offs?"
      />

      <QuantizationExplorer />

      <ExplainerBlock
        title="The throughput multiplier"
        body="Quantization is the single largest lever on inference cost. Going from FP32 → INT4 cuts memory ~8x; on GPU you can fit ~8x larger batches; throughput tracks with batch size up to the point of compute saturation. For a 7B model on a 16 GB GPU, this is the difference between &ldquo;4 concurrent users&rdquo; and &ldquo;32 concurrent users.&rdquo; The honest caveat: at INT4, certain tasks (reasoning, code) degrade noticeably; benchmark on your workload before shipping the smallest quant."
      />
    </div>
  );
}

const PRECISIONS = [
  {
    id: 'fp32',
    label: 'FP32',
    bits: 32,
    sizePct: 100,
    qualityPct: 100,
    ramGb: 28,
    used: 'Training reference',
    fits: { cpu: false, gpu8: false, gpu16: false, gpu24: true },
  },
  {
    id: 'bf16',
    label: 'BF16',
    bits: 16,
    sizePct: 50,
    qualityPct: 99,
    ramGb: 14,
    used: 'PyTorch / HF Transformers',
    fits: { cpu: false, gpu8: false, gpu16: true, gpu24: true },
  },
  {
    id: 'int8',
    label: 'INT8',
    bits: 8,
    sizePct: 25,
    qualityPct: 96,
    ramGb: 7,
    used: 'bitsandbytes / vLLM',
    fits: { cpu: true, gpu8: true, gpu16: true, gpu24: true },
  },
  {
    id: 'int4',
    label: 'INT4',
    bits: 4,
    sizePct: 12.5,
    qualityPct: 88,
    ramGb: 3.5,
    used: 'GGUF / GPTQ / AWQ / QLoRA',
    fits: { cpu: true, gpu8: true, gpu16: true, gpu24: true },
  },
];

function QuantizationExplorer() {
  const [selected, setSelected] = useState<string>('int4');
  const current = PRECISIONS.find((p) => p.id === selected) ?? PRECISIONS[0];

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          The precision spectrum
        </h3>
        <p className="text-sm text-muted">
          7-billion-parameter base model. Click a column to see what it costs
          you in memory and what it costs the model in quality.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {PRECISIONS.map((p) => {
          const active = p.id === selected;
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className="space-y-2 border bg-paper p-3 text-left transition"
              style={{
                borderTop: `2px solid ${VIZ.coral}`,
                background: active ? `${VIZ.coral}14` : undefined,
                opacity: active ? 1 : 0.7,
              }}
            >
              <div className="flex items-baseline justify-between">
                <span
                  className="font-mono text-[12px] font-semibold"
                  style={{ color: VIZ.coral }}
                >
                  {p.label}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                  {p.bits} bit
                </span>
              </div>

              <BarRow label="size" pct={p.sizePct} color={VIZ.coral} />
              <BarRow label="quality" pct={p.qualityPct} color={VIZ.green} />

              <div className="flex items-baseline justify-between text-[11px] pt-1">
                <span className="font-mono text-[10px] text-muted">7B RAM</span>
                <span className="font-mono">{p.ramGb} GB</span>
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="space-y-3 border bg-paper p-4"
        style={{ borderLeft: `3px solid ${VIZ.coral}` }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: VIZ.coral }}
            >
              {current.label} · selected
            </div>
            <p className="mt-0.5 text-[12px] text-foreground/80">
              Used by{' '}
              <span className="font-mono text-[11px]">{current.used}</span>
            </p>
          </div>
          <span className="font-mono text-[11px] text-foreground/80">
            7B model · {current.ramGb} GB
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FitsChip label="CPU only" on={current.fits.cpu} />
          <FitsChip label="8 GB GPU" on={current.fits.gpu8} />
          <FitsChip label="16 GB GPU" on={current.fits.gpu16} />
          <FitsChip label="24 GB GPU" on={current.fits.gpu24} />
        </div>
      </div>
    </div>
  );
}

function BarRow({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="relative h-2 bg-rule/40">
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: color,
            opacity: 0.85,
          }}
        />
      </div>
    </div>
  );
}

function FitsChip({ label, on }: { label: string; on: boolean }) {
  const color = on ? VIZ.green : VIZ.grey;
  return (
    <span
      className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
      style={{
        borderColor: color,
        color,
        background: `${color}1F`,
        opacity: on ? 1 : 0.6,
      }}
    >
      {on ? '✓' : '✗'} {label}
    </span>
  );
}

// ─── Concept deep-dive (always-visible footer section) ───────────

type ExplainResponse = {
  concept: string;
  title: string;
  one_line: string;
  analogy: string;
  steps: { label: string; description: string }[];
  complexity: 'medium' | 'high';
  why_it_matters: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

const CONCEPTS: { id: string; label: string }[] = [
  { id: 'lora', label: 'LoRA / QLoRA' },
  { id: 'rlhf', label: 'RLHF' },
  { id: 'dpo', label: 'DPO' },
  { id: 'alignment', label: 'Alignment' },
  { id: 'quantization', label: 'Quantization' },
];

function ConceptDeepDiveSection({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  const [concept, setConcept] = useState('lora');
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day18/explain-concept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as ExplainResponse);
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
          Concept deep-dive
        </h2>
        <p className="text-sm text-muted">
          Pick one of the five concepts. The model returns a one-liner, a
          concrete analogy, the mechanism in numbered steps, and a
          why-it-matters paragraph. Stays visible no matter which tab
          you&apos;re on.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <ProviderRow
          provider={provider}
          setProvider={setProvider}
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          {CONCEPTS.map((c) => {
            const active = c.id === concept;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setConcept(c.id)}
                disabled={loading}
                className={[
                  'border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition disabled:opacity-40',
                  active
                    ? 'border-accent bg-accent text-background'
                    : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
                ].join(' ')}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <SubmitButton
          loading={loading}
          idle="Explain this concept →"
          busy="Explaining…"
          disabled={loading}
        />
      </form>

      {error && <ErrorBox message={error} />}
      {result && <ExplainResult result={result} />}
    </section>
  );
}

function ExplainResult({ result }: { result: ExplainResponse }) {
  return (
    <div className="space-y-4">
      <div
        className="border border-rule bg-paper p-4 space-y-3"
        style={{ borderTop: `2px solid ${COMPLEXITY_COLOR[result.complexity]}` }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-serif text-2xl font-semibold">
            {result.title}
          </h3>
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
        {result.one_line && (
          <p className="text-sm leading-relaxed text-foreground/90">
            {result.one_line}
          </p>
        )}
        <Footer>
          {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
          {result.latency_ms}ms
        </Footer>
      </div>

      {result.analogy && (
        <div
          className="border p-4"
          style={{
            borderColor: VIZ.amber,
            background: `${VIZ.amber}10`,
          }}
        >
          <div
            className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.amber }}
          >
            Analogy
          </div>
          <p className="text-sm italic leading-relaxed text-foreground/90">
            {result.analogy}
          </p>
        </div>
      )}

      {result.steps.length > 0 && (
        <ol className="space-y-2">
          {result.steps.map((s, i) => (
            <li
              key={i}
              className="border border-rule bg-paper p-3"
              style={{
                animation: `stepFadeIn 360ms ease-out ${i * 100}ms both`,
              }}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="font-mono text-[11px] font-semibold"
                  style={{ color: VIZ.violet }}
                >
                  {i + 1}.
                </span>
                <div className="space-y-1">
                  <div className="font-serif text-[15px] font-semibold">
                    {s.label}
                  </div>
                  {s.description && (
                    <p className="text-[13px] leading-relaxed text-foreground/85">
                      {s.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {result.why_it_matters && (
        <div
          className="border bg-paper p-4"
          style={{ borderLeft: `3px solid ${VIZ.green}` }}
        >
          <div
            className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.green }}
          >
            Why it matters
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">
            {result.why_it_matters}
          </p>
        </div>
      )}
    </div>
  );
}
