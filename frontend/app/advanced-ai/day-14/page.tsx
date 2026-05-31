'use client';

import { useState } from 'react';
import ModelSwitcher from '../../components/ModelSwitcher';
import { Markdown } from '../../components/Markdown';
import { useNodeProgress } from '../../components/useNodeProgress';
import DayPager from '../../components/DayPager';

const NODES = [
  { id: 'N66', label: 'Ollama', title: 'Ollama' },
  { id: 'N67', label: 'vLLM', title: 'vLLM + PagedAttention' },
  { id: 'N68', label: 'TGI', title: 'TGI' },
  { id: 'N69', label: 'llama.cpp', title: 'llama.cpp + Quantization' },
  { id: 'N70', label: 'LM Studio', title: 'LM Studio + Compare' },
];

const VIZ = {
  green: '#1D9E75',
  blue: '#378ADD',
  violet: '#7F77DD',
  amber: '#FAC775',
  coral: '#F5C4B3',
  red: '#E24B4A',
  grey: '#9CA3AF',
} as const;

const API = 'http://localhost:8000';

export default function Day14Page() {
  const [activeId, setActiveId] = useState('N66');
  const [provider, setProvider] = useState('openai');
  const progress = useNodeProgress(14);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 14 · Local Model Inference
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
          Run an LLM without a{' '}
          <span className="text-accent">cloud bill</span>.
        </h1>
        <p className="text-sm text-muted">
          Ollama, vLLM, TGI, llama.cpp, LM Studio &mdash; five ways to host
          a model on hardware you can touch. Each tab is N66&ndash;N70.
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

      <div className={activeId === 'N66' ? undefined : 'hidden'}>
        <NodeOllama provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N67' ? undefined : 'hidden'}>
        <NodeVLLM provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N68' ? undefined : 'hidden'}>
        <NodeTGI provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N69' ? undefined : 'hidden'}>
        <NodeLlamaCpp provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N70' ? undefined : 'hidden'}>
        <NodeLMStudio provider={provider} setProvider={setProvider} />
      </div>
      <DayPager day={14} advanced />
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
      const r = await fetch(`${API}/day14/ask`, {
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

// ─── N66 — Ollama ────────────────────────────────────────────────

function NodeOllama({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Ollama"
        hint="The friendliest way to run a local LLM. One command pulls a model + starts a server with an OpenAI-compatible API. Wraps llama.cpp under the hood for the actual inference work."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="One command"
          body="`ollama run llama3` downloads + starts the model in a single invocation. No virtualenv, no manual quantization picking, no flags &mdash; just works on Mac, Linux, and Windows."
          color={VIZ.green}
        />
        <FactCard
          tag="OpenAI-compatible API"
          body="Exposes /v1/chat/completions on port 11434 by default. Point your existing OpenAI SDK at http://localhost:11434/v1 and your code is unchanged."
          color={VIZ.green}
        />
        <FactCard
          tag="GGUF + Modelfile"
          body="Models come pre-quantized in GGUF. Write a Modelfile (Docker-style) to bake in system prompts, parameters, or LoRA adapters &mdash; produces a new tagged model."
          color={VIZ.green}
        />
        <FactCard
          tag="CPU or GPU"
          body="Auto-detects CUDA / Metal / ROCm. Drops to CPU when no GPU is present. 7B Q4 runs ~3-5 tok/s on 8 GB RAM CPU; 30+ tok/s on a midrange GPU."
          color={VIZ.green}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.green}
        presets={[
          'How do I run Llama 3 locally with Ollama?',
          'What is the difference between Ollama and llama.cpp?',
          'How do I write an Ollama Modelfile?',
        ]}
        defaultQuestion="What is Ollama and how do I get started?"
      />
      <ExplainerBlock
        title="The default starting point"
        body="If you've never run a local model before, start with Ollama. The install-to-first-token path is shorter than any other option on this page — five minutes from `curl install.sh` to a working chat. Once the workflow clicks, you'll find yourself reaching for llama.cpp directly when you want more control, or vLLM when you need throughput. But for prototyping and personal use, Ollama is usually enough."
      />
    </div>
  );
}

// ─── N67 — vLLM + PagedAttention ─────────────────────────────────

function NodeVLLM({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="vLLM"
        hint="The throughput champion. Python + CUDA + a clever memory layout (PagedAttention) that fits 2-5x more concurrent requests on the same GPU than naive transformers. The default for self-hosted production LLM serving."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="PagedAttention"
          body="The KV cache is split into small fixed-size pages and allocated on demand. Wastes far less VRAM than the traditional 'reserve the worst case' approach &mdash; see the visual below."
          color={VIZ.violet}
        />
        <FactCard
          tag="OpenAI-compatible"
          body="vllm serve gives you /v1/chat/completions out of the box. Same drop-in pattern as Ollama: change base_url, keep the rest."
          color={VIZ.violet}
        />
        <FactCard
          tag="Linux + CUDA only"
          body="Officially Linux-only with CUDA 12.1+. There's a ROCm path for AMD; macOS / Windows native don't work. WSL2 on Windows is the typical bypass."
          color={VIZ.violet}
        />
        <FactCard
          tag="Continuous batching"
          body="Requests arriving mid-decode get added to the current batch instead of waiting in a queue. Result: GPU utilization stays high, p50 latency stays low even under load."
          color={VIZ.violet}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.violet}
        presets={[
          'What is PagedAttention and why does it matter?',
          'When is vLLM the right pick over Ollama or TGI?',
          'How does continuous batching work in vLLM?',
        ]}
        defaultQuestion="What does vLLM give me that Ollama does not?"
      />

      <PagedAttentionVisual />

      <ExplainerBlock
        title="The throughput choice"
        body="If you're serving one user at a time, vLLM's wins are minor. But put 10, 50, 100 concurrent requests through the same GPU and the gap explodes — vLLM stays responsive while a naive transformer-based server starts OOMing or queuing. The cost is operational complexity: Linux only, CUDA dependencies, more flags to tune. Worth it when you're past the 'play with a local model' stage and serving real traffic."
      />
    </div>
  );
}

// ─── PagedAttention visual (inside N67) ──────────────────────────

function PagedAttentionVisual() {
  const [requests, setRequests] = useState(4);
  // Each request needs a chunk of KV cache. Traditional reserves the max
  // possible per request even if not used; PagedAttention only allocates
  // the pages it actually needs. We model this with synthetic numbers
  // tuned to make the picture intuitive.
  const TOTAL_BLOCKS = 16;
  const TRAD_PER_REQUEST = 4; // each request locks 4 blocks worth
  const PAGED_PER_REQUEST = 2; // each request uses ~2 blocks on demand

  const tradUsed = Math.min(TOTAL_BLOCKS, requests * TRAD_PER_REQUEST);
  const pagedUsed = Math.min(TOTAL_BLOCKS, requests * PAGED_PER_REQUEST);
  const tradOOM = requests * TRAD_PER_REQUEST > TOTAL_BLOCKS;
  const pagedOOM = requests * PAGED_PER_REQUEST > TOTAL_BLOCKS;

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Why PagedAttention matters
        </h3>
        <p className="text-sm text-muted">
          The KV cache is the per-request memory the model uses to attend to
          earlier tokens. Slide the requests count to feel the difference.
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Concurrent requests
          </span>
          <span className="font-mono text-[11px] text-foreground/80">
            {requests}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={16}
          value={requests}
          onChange={(e) => setRequests(parseInt(e.target.value, 10))}
          aria-label="Concurrent requests"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <KVBoxCard
          title="Traditional KV cache"
          subtitle="Reserve worst-case slab per request"
          color={VIZ.coral}
          blocks={TOTAL_BLOCKS}
          used={tradUsed}
          oom={tradOOM}
          mode="traditional"
        />
        <KVBoxCard
          title="PagedAttention (vLLM)"
          subtitle="Allocate small pages on demand"
          color={VIZ.violet}
          blocks={TOTAL_BLOCKS}
          used={pagedUsed}
          oom={pagedOOM}
          mode="paged"
        />
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        Numbers are illustrative; real ratios vary by model + context length.
      </p>
    </div>
  );
}

function KVBoxCard({
  title,
  subtitle,
  color,
  blocks,
  used,
  oom,
  mode,
}: {
  title: string;
  subtitle: string;
  color: string;
  blocks: number;
  used: number;
  oom: boolean;
  mode: 'traditional' | 'paged';
}) {
  return (
    <div
      className="space-y-2 border border-rule bg-paper p-3"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div className="space-y-0.5">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color }}
        >
          {title}
        </div>
        <p className="text-[11px] text-muted">{subtitle}</p>
      </div>

      <div className="relative">
        {/* Memory grid */}
        <div className="grid grid-cols-4 gap-[3px]">
          {Array.from({ length: blocks }).map((_, i) => {
            const filled = i < used;
            const wasted = mode === 'traditional' && !filled && used > 0;
            return (
              <div
                key={i}
                className="h-7"
                style={{
                  background: filled
                    ? color
                    : wasted
                      ? `${color}26`
                      : 'transparent',
                  border: `1px solid ${
                    filled
                      ? color
                      : wasted
                        ? `${color}55`
                        : 'var(--rule)'
                  }`,
                }}
              />
            );
          })}
        </div>
        {oom && (
          <div
            className="absolute inset-0 flex items-center justify-center font-mono text-xs uppercase tracking-[0.2em]"
            style={{
              background: 'rgba(226, 75, 74, 0.85)',
              color: '#fff',
            }}
          >
            ✗ Out of memory
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wide text-muted">
        <span>
          {Math.min(used, blocks)} / {blocks} blocks used
        </span>
        <span>
          {Math.round((Math.min(used, blocks) / blocks) * 100)}%
        </span>
      </div>
    </div>
  );
}

// ─── N68 — TGI ───────────────────────────────────────────────────

function NodeTGI({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Text Generation Inference (TGI)"
        hint="HuggingFace's production server. Docker-first, ships with continuous batching + tensor parallelism + an OpenAI-compatible API. The 'official' way to serve Hub models at scale."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Docker-first"
          body="docker run ghcr.io/huggingface/text-generation-inference --model-id meta-llama/Llama-3-8B-Instruct. One command, no Python install."
          color={VIZ.blue}
        />
        <FactCard
          tag="OpenAI + native API"
          body="Exposes both a Messages API (OpenAI-style) and a HuggingFace-native /generate endpoint. SDK drop-in works for either."
          color={VIZ.blue}
        />
        <FactCard
          tag="Tensor parallelism"
          body="Splits a model across multiple GPUs automatically (--num-shard 2). Lets you serve 70B+ models on 2x or 4x consumer cards that wouldn't fit individually."
          color={VIZ.blue}
        />
        <FactCard
          tag="Hub auth built-in"
          body="Reads HF_TOKEN at startup. Gated models (Llama, Mistral) work directly without manual download &mdash; TGI pulls the right shards."
          color={VIZ.blue}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.blue}
        presets={[
          'When does TGI beat vLLM?',
          'How does tensor parallelism work in TGI?',
          'What does TGI add on top of plain Transformers serving?',
        ]}
        defaultQuestion="What is TGI and when should I reach for it?"
      />
      <ExplainerBlock
        title="The HuggingFace-native production option"
        body="TGI is what you reach for when your team is already on HuggingFace. The integration is tight: HF_TOKEN auth, model-card-driven config, Hub safetensors loaded directly. Performance is competitive with vLLM but the philosophy differs &mdash; TGI is 'serve any Hub model out of the box' while vLLM is 'squeeze the most tokens per second out of NVIDIA hardware'. Different goals, similar latency for most workloads."
      />
    </div>
  );
}

// ─── N69 — llama.cpp + Quantization ──────────────────────────────

function NodeLlamaCpp({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="llama.cpp"
        hint="The low-level C++ engine almost every consumer local LLM tool wraps. Pure CPU + CUDA + Metal + Vulkan code, no Python required, GGUF quantization is the default. Ollama, LM Studio, and many others sit on top of this."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Pure C++"
          body="Single binary after `cmake --build .`. No virtualenv, no model loaders, no PyTorch dependency. Runs everywhere a C++ compiler does."
          color={VIZ.amber}
        />
        <FactCard
          tag="GGUF format"
          body="A binary tensor format with quantization metadata baked in. The format Ollama / LM Studio / koboldcpp all consume. Convert from safetensors with convert-hf-to-gguf.py."
          color={VIZ.amber}
        />
        <FactCard
          tag="Metal + CUDA + Vulkan"
          body="GPU backends for Apple Silicon, NVIDIA, AMD, Intel ARC. One source tree, one set of flags. Same model file runs on every supported device."
          color={VIZ.amber}
        />
        <FactCard
          tag="llama-server"
          body="A bundled HTTP server with an OpenAI-compatible endpoint. If Ollama feels like overkill, this is the raw equivalent &mdash; same C++ under both."
          color={VIZ.amber}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.amber}
        presets={[
          'What is GGUF and how does it differ from safetensors?',
          'When should I use llama.cpp directly instead of Ollama?',
          'Which quantization should I pick for a 7B model on 8 GB RAM?',
        ]}
        defaultQuestion="What does llama.cpp do, and where does it sit in the stack?"
      />

      <QuantizationVisual />

      <ExplainerBlock
        title="The engine under everything else"
        body="If you've ever run a local model through any GUI or CLI on consumer hardware, you've probably been talking to llama.cpp without realising it. Ollama wraps it. LM Studio embeds it. koboldcpp / oobabooga ship it. Going direct is for when you need control over quantization, threading, or KV cache settings that the wrappers hide. For day-to-day use, a wrapper is fine — but knowing it's there changes how you debug performance."
      />
    </div>
  );
}

// ─── Quantization visual (inside N69) ────────────────────────────

const PRECISIONS = [
  { id: 'fp32', label: 'FP32', size: 100, quality: 100 },
  { id: 'bf16', label: 'BF16', size: 50, quality: 99 },
  { id: 'int8', label: 'INT8 (Q8)', size: 27, quality: 96 },
  { id: 'int4', label: 'INT4 (Q4)', size: 14, quality: 88 },
] as const;

function QuantizationVisual() {
  const [precisionIdx, setPrecisionIdx] = useState(2); // INT8 default
  const p = PRECISIONS[precisionIdx];

  // A 7B model at FP32 is ~28 GB. Scale from there.
  const FP32_GB = 28;
  const actualGB = (FP32_GB * p.size) / 100;
  const fits8 = actualGB <= 8;
  const fits16 = actualGB <= 16;
  const fits24 = actualGB <= 24;

  return (
    <div className="space-y-4 border-t border-rule pt-6">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Quantization &mdash; trade size for quality
        </h3>
        <p className="text-sm text-muted">
          Drag the precision down and watch the model shrink. Real numbers for
          a 7B model &mdash; FP32 needs 28 GB; INT4 fits on a phone.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRECISIONS.map((q, i) => {
          const active = i === precisionIdx;
          return (
            <button
              key={q.id}
              onClick={() => setPrecisionIdx(i)}
              className={[
                'border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition',
                active
                  ? 'border-accent bg-accent text-background'
                  : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
              ].join(' ')}
            >
              {q.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <QuantBar
          label="Model size"
          value={p.size}
          color={VIZ.coral}
          unit={`${actualGB.toFixed(1)} GB`}
        />
        <QuantBar
          label="Quality (relative)"
          value={p.quality}
          color={VIZ.green}
          unit={`${p.quality}%`}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-rule pt-4">
        <FitsBadge ok={fits8} label="8 GB RAM" />
        <FitsBadge ok={fits16} label="16 GB RAM" />
        <FitsBadge ok={fits24} label="24 GB RAM" />
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        7B model · llama.cpp uses GGUF · Ollama uses llama.cpp under the hood
      </p>
    </div>
  );
}

function QuantBar({
  label,
  value,
  color,
  unit,
}: {
  label: string;
  value: number;
  color: string;
  unit: string;
}) {
  return (
    <div className="space-y-1.5 border border-rule bg-paper p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {label}
        </span>
        <span
          className="font-mono text-[11px]"
          style={{ color }}
        >
          {unit}
        </span>
      </div>
      <div className="h-2 w-full bg-rule">
        <div
          className="h-full"
          style={{
            width: `${value}%`,
            background: color,
            transition: 'width 250ms ease-out',
          }}
        />
      </div>
    </div>
  );
}

function FitsBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide"
      style={{
        borderColor: ok ? VIZ.green : VIZ.grey,
        color: ok ? VIZ.green : VIZ.grey,
        background: ok ? `${VIZ.green}1F` : 'transparent',
      }}
    >
      {ok ? '✓' : '✗'} fits in {label}
    </span>
  );
}

// ─── N70 — LM Studio + Runtime Compare ───────────────────────────

function NodeLMStudio({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="LM Studio"
        hint="The GUI option. A desktop app for Mac / Windows / Linux that bundles llama.cpp under the hood and gives you a model browser, chat panel, and local server toggle. Closest thing to 'Ollama with a UI'."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Model browser"
          body="Built-in HuggingFace search + filter by size / quantization / compatibility. Click download &mdash; the GGUF lands in a local cache, ready to load."
          color={VIZ.coral}
        />
        <FactCard
          tag="Local server toggle"
          body="One button starts an OpenAI-compatible server on http://localhost:1234. Same URL pattern as Ollama (just different port) &mdash; drop into existing SDK code."
          color={VIZ.coral}
        />
        <FactCard
          tag="GPU layers slider"
          body="Pick how many transformer layers to offload to GPU. Lets you balance VRAM use against speed without restarting the app."
          color={VIZ.coral}
        />
        <FactCard
          tag="Closed source"
          body="Free for personal use but not open source. The trade-off for the polished UI &mdash; you can't fork it, and the model catalogue is curated."
          color={VIZ.coral}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.coral}
        presets={[
          'When is LM Studio a better pick than Ollama?',
          'What does the GPU layers slider in LM Studio actually do?',
          'Why is LM Studio closed source — does it matter?',
        ]}
        defaultQuestion="What does LM Studio offer that the CLI tools do not?"
      />

      <RuntimeComparePanel provider={provider} setProvider={setProvider} />

      <ExplainerBlock
        title="The 'no terminal' option"
        body="LM Studio fills the same niche as Ollama for users who'd rather not open a terminal. It is also a real onboarding tool — once you're comfortable in the UI, swapping to Ollama (CLI) or llama.cpp (raw engine) gets easier because you already understand the parameters they expose. The closed-source nature is the main objection; for personal use it's a non-issue, for production it's a deal-breaker."
      />
    </div>
  );
}

// ─── Runtime comparison panel (inside N70) ───────────────────────

type Runtime = {
  name: string;
  setup: 'easy' | 'medium' | 'advanced';
  throughput: 'low' | 'medium' | 'high';
  gpu_required: boolean;
  gui: boolean;
  api_compatible: boolean;
  quantization_support: boolean;
  ram_8gb: boolean;
  ram_16gb: boolean;
  best_for: string;
};

type CompareResponse = {
  runtimes: Runtime[];
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

const SETUP_COLOR: Record<Runtime['setup'], string> = {
  easy: VIZ.green,
  medium: VIZ.amber,
  advanced: VIZ.red,
};

const THROUGHPUT_COLOR: Record<Runtime['throughput'], string> = {
  low: VIZ.grey,
  medium: VIZ.blue,
  high: VIZ.green,
};

function RuntimeComparePanel({
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
      const r = await fetch(`${API}/day14/runtime-compare`, {
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
            Compare all five runtimes
          </h3>
          <p className="mt-1 text-sm text-muted">
            Setup difficulty, throughput tier, GPU requirement, OpenAI-API
            compatibility, and whether it fits on 8 GB / 16 GB RAM.
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
            {loading ? 'comparing…' : 'Compare runtimes →'}
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
        Note: this day teaches local runtimes as concepts. The Ask above is
        answered by your selected cloud provider (OpenAI / Groq / DeepSeek /
        Gemini), not by a local model.
      </div>

      {error && <ErrorBox message={error} />}
      {result && <RuntimeMatrix runtimes={result.runtimes} />}
      {result && (
        <Footer>
          {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
          {result.latency_ms}ms
        </Footer>
      )}
    </div>
  );
}

function RuntimeMatrix({ runtimes }: { runtimes: Runtime[] }) {
  return (
    <div className="overflow-x-auto border border-rule bg-paper">
      <table className="w-full border-collapse text-[13px]">
        <thead className="sticky top-0 bg-paper/95">
          <tr>
            <Th>Runtime</Th>
            <Th>Setup</Th>
            <Th>Throughput</Th>
            <Th center>GPU req</Th>
            <Th center>GUI</Th>
            <Th center>OpenAI API</Th>
            <Th center>Quant</Th>
            <Th center>8 GB</Th>
            <Th center>16 GB</Th>
            <Th>Best for</Th>
          </tr>
        </thead>
        <tbody>
          {runtimes.map((r) => (
            <tr key={r.name} className="border-t border-rule align-top">
              <td className="px-3 py-2 font-mono text-[12px] text-foreground/90">
                {r.name}
              </td>
              <Td>
                <Pill text={r.setup} color={SETUP_COLOR[r.setup]} />
              </Td>
              <Td>
                <Pill
                  text={r.throughput}
                  color={THROUGHPUT_COLOR[r.throughput]}
                />
              </Td>
              <Td center>
                <Check on={r.gpu_required} />
              </Td>
              <Td center>
                <Check on={r.gui} />
              </Td>
              <Td center>
                <Check on={r.api_compatible} />
              </Td>
              <Td center>
                <Check on={r.quantization_support} />
              </Td>
              <Td center>
                <Check on={r.ram_8gb} />
              </Td>
              <Td center>
                <Check on={r.ram_16gb} />
              </Td>
              <Td>{r.best_for}</Td>
            </tr>
          ))}
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

function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
      style={{
        borderColor: color,
        color,
        background: `${color}1F`,
      }}
    >
      {text}
    </span>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      aria-label={on ? 'yes' : 'no'}
      style={{ color: on ? VIZ.green : VIZ.grey }}
      className="font-mono text-[13px]"
    >
      {on ? '✓' : '✗'}
    </span>
  );
}
