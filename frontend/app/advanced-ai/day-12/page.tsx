'use client';

import { useState } from 'react';
import ModelSwitcher from '../../components/ModelSwitcher';
import { Markdown } from '../../components/Markdown';
import { useNodeProgress } from '../../components/useNodeProgress';
import DayPager from '../../components/DayPager';

const NODES = [
  { id: 'N56', label: 'PyTorch', title: 'PyTorch' },
  { id: 'N57', label: 'TF / Keras', title: 'TensorFlow / Keras' },
  { id: 'N58', label: 'HF Hub', title: 'HuggingFace Hub' },
  { id: 'N59', label: 'Transformers', title: 'Transformers library' },
  { id: 'N60', label: 'ONNX', title: 'ONNX Runtime + Ecosystem' },
];

const VIZ = {
  green: '#1D9E75',
  blue: '#378ADD',
  violet: '#7F77DD',
  amber: '#FAC775',
  coral: '#F5C4B3',
  teal: '#2DBFB0',
  grey: '#9CA3AF',
} as const;

const COLOR_HINT: Record<string, string> = {
  blue: VIZ.blue,
  teal: VIZ.teal,
  amber: VIZ.amber,
  purple: VIZ.violet,
  coral: VIZ.coral,
  grey: VIZ.grey,
};

const LAYER_COLOR: Record<string, string> = {
  hardware: VIZ.grey,
  low_level: VIZ.blue,
  high_level: VIZ.teal,
  hub: VIZ.amber,
  runtime: VIZ.violet,
};

const LAYER_LABEL: Record<string, string> = {
  hardware: 'Hardware',
  low_level: 'Low-level',
  high_level: 'High-level',
  hub: 'Hub',
  runtime: 'Runtime',
};

// Render order top → bottom in the stack: runtime sits on top, hardware at base
const LAYER_STACK = ['runtime', 'hub', 'high_level', 'low_level', 'hardware'];

const API = 'http://localhost:8000';

export default function Day12Page() {
  const [activeId, setActiveId] = useState('N56');
  const [provider, setProvider] = useState('openai');
  const progress = useNodeProgress(12);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 12 · ML Frameworks
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
          The stack underneath{' '}
          <span className="text-accent">every modern LLM</span>.
        </h1>
        <p className="text-sm text-muted">
          PyTorch, TensorFlow / Keras, HuggingFace, Transformers, ONNX
          &mdash; how they slot together. Each tab is N56&ndash;N60.
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

      <div className={activeId === 'N56' ? undefined : 'hidden'}>
        <NodePyTorch provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N57' ? undefined : 'hidden'}>
        <NodeTFKeras provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N58' ? undefined : 'hidden'}>
        <NodeHFHub provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N59' ? undefined : 'hidden'}>
        <NodeTransformers provider={provider} setProvider={setProvider} />
      </div>
      <div className={activeId === 'N60' ? undefined : 'hidden'}>
        <NodeONNX provider={provider} setProvider={setProvider} />
      </div>
      <DayPager day={12} advanced />
    </article>
  );
}

// ─── shared blocks (same shape as Day 11) ──────────────────────────

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
      const r = await fetch(`${API}/day12/ask`, {
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

// ─── N56 — PyTorch ───────────────────────────────────────────────

function NodePyTorch({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="PyTorch"
        hint="Meta's tensor engine + autograd. Define-by-run: your Python code IS the model graph, so loops and conditionals just work and debugging looks like ordinary Python."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Open-sourced 2016"
          body="By Meta AI (then Facebook AI Research). Now the default research framework — most papers ship code in PyTorch."
          color={VIZ.blue}
        />
        <FactCard
          tag="Dynamic graphs"
          body="The graph is built as your Python runs. No compile step before you can print(tensor.grad). Trade-off vs static graphs: easier debugging, slightly slower out of the box."
          color={VIZ.blue}
        />
        <FactCard
          tag="autograd"
          body="Every tensor remembers how it was made. Call .backward() and gradients propagate through the whole chain automatically — no manual derivatives."
          color={VIZ.blue}
        />
        <FactCard
          tag="CUDA + MPS + ROCm"
          body=".to('cuda') and the tensor lives on your NVIDIA GPU. Same API for Apple Silicon (mps) and AMD (rocm). Hardware is one device string away."
          color={VIZ.blue}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.blue}
        presets={[
          'What does define-by-run mean in PyTorch?',
          'How does autograd actually work under the hood?',
          'When would I pick PyTorch over TensorFlow today?',
        ]}
        defaultQuestion="What does PyTorch give me that plain numpy does not?"
      />
      <ExplainerBlock
        title="The research-to-production default"
        body="If you're learning deep learning in 2026, you're almost certainly writing PyTorch. The ergonomics — Python-first, eager mode, readable stack traces — won the research community a few years ago, and the production story has caught up (TorchScript, torch.compile, ExecuTorch). Most HuggingFace models ship a PyTorch implementation first, and ONNX export from PyTorch is well-trodden."
      />
    </div>
  );
}

// ─── N57 — TensorFlow / Keras ────────────────────────────────────

function NodeTFKeras({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="TensorFlow / Keras"
        hint="Google's production-first stack. TensorFlow is the low-level computation engine; Keras is the friendly high-level API on top. Originally static-graph, now eager-by-default like PyTorch."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Two layers, one project"
          body="Keras is a wrapper — model = keras.Sequential([...]) is just sugar over TensorFlow ops. You can drop down to tf.* whenever you need control, or stay in Keras for the 95% case."
          color={VIZ.teal}
        />
        <FactCard
          tag="Graph mode → XLA"
          body="tf.function compiles your Python into a static graph. XLA then fuses ops for huge speedups, especially on TPUs. Trade-off: harder to debug, but production-fast."
          color={VIZ.teal}
        />
        <FactCard
          tag="TPU-native"
          body="Google's TPUs are first-class. If you're training on Google Cloud at scale, TF/Keras still has the smoothest path. PyTorch reaches TPUs via XLA too but with more friction."
          color={VIZ.teal}
        />
        <FactCard
          tag="Deployment ecosystem"
          body="TF Serving, TF Lite (mobile), TF.js (browser), TFX (pipelines). Google built the whole production funnel, which is why TF still dominates inside Google and many enterprises."
          color={VIZ.teal}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.teal}
        presets={[
          'When is TensorFlow / Keras a better pick than PyTorch?',
          'What is the difference between Keras and TensorFlow?',
          'Why did PyTorch overtake TensorFlow in research?',
        ]}
        defaultQuestion="What does Keras add on top of TensorFlow?"
      />
      <ExplainerBlock
        title="Production-first, then ergonomics"
        body="TensorFlow started as Google's internal production system, then exposed an API. PyTorch started as a research-first API, then added production. Both can do both jobs in 2026, but the cultural defaults still show — TF gets you to a deployed TFLite model on Android faster, PyTorch gets you to a working research prototype faster."
      />
    </div>
  );
}

// ─── N58 — HuggingFace Hub ───────────────────────────────────────

function NodeHFHub({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="HuggingFace Hub"
        hint="GitHub for ML. ~1M+ pre-trained models, ~200k+ datasets, hosted demos (Spaces). The hub layer that turns 'download a model' into a one-line API call."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Model cards"
          body="Every model has a README + metadata: task tag, license, training data, eval metrics, code snippet. Like a package page on npm, but for neural networks."
          color={VIZ.amber}
        />
        <FactCard
          tag="from_pretrained()"
          body="One line — AutoModel.from_pretrained('bert-base-uncased') — downloads weights + config + tokenizer, caches them locally, returns a ready PyTorch / TF model."
          color={VIZ.amber}
        />
        <FactCard
          tag="Datasets + Spaces"
          body="The Hub also hosts datasets (datasets.load_dataset(...)) and live Gradio / Streamlit demos. Three-in-one platform: weights, data, hosted UI."
          color={VIZ.amber}
        />
        <FactCard
          tag="Inference API"
          body="Pay-as-you-go hosted inference on Hub models. Useful for prototypes where you don't want to download 30 GB of weights just to try one prompt."
          color={VIZ.amber}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.amber}
        presets={[
          'How is HuggingFace Hub different from GitHub?',
          'What is a model card, and what should I look for?',
          'When should I download weights locally vs use the Inference API?',
        ]}
        defaultQuestion="What does HuggingFace Hub do that PyTorch alone does not?"
      />
      <ExplainerBlock
        title="The distribution layer"
        body="PyTorch and TensorFlow give you the engine. HuggingFace Hub gives you a million pre-trained things to run on that engine. It's the reason 'I want to do sentiment analysis' went from 'train a model for a week' (2015) to 'pip install transformers + pipeline('sentiment-analysis')' (2020 onwards). Distribution mattered more than yet another framework."
      />
    </div>
  );
}

// ─── N59 — Transformers library ──────────────────────────────────

function NodeTransformers({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Transformers library"
        hint="HuggingFace's Python library. Loads any Hub model with a single class — AutoModel, AutoTokenizer, AutoProcessor — and ships pipeline() for one-liner inference."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="Five-stage pipeline"
          body="Raw text → Tokenizer → Model → Head/Post-processor → output. The pipeline() helper hides all five stages behind a single .call() — sentiment, NER, summarization, embeddings, etc."
          color={VIZ.violet}
        />
        <FactCard
          tag="Auto* classes"
          body="AutoModel.from_pretrained(name) inspects the model card and picks the right architecture class for you. Switch from BERT to RoBERTa to DeBERTa with one string change."
          color={VIZ.violet}
        />
        <FactCard
          tag="PyTorch + TF + JAX"
          body="Same Python API, three backends. Most models exist in PyTorch + TF, some also in Flax/JAX. The library is the abstraction over the framework."
          color={VIZ.violet}
        />
        <FactCard
          tag="The fine-tuning recipe"
          body="Trainer + TrainingArguments give you a working training loop in ~30 lines: dataset, model, args, .train(). PEFT / LoRA hooks in cleanly when you only want to fine-tune adapters."
          color={VIZ.violet}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.violet}
        presets={[
          'What does pipeline() actually do under the hood?',
          'How do AutoModel and AutoTokenizer work together?',
          'When should I use pipeline() vs AutoModel + manual control?',
        ]}
        defaultQuestion="What does the Transformers library give me that the Hub alone does not?"
      />
      <ExplainerBlock
        title="The friendly face of the Hub"
        body="The Hub is the storefront; Transformers is the SDK that knows how to consume it. Without Transformers you'd be hand-rolling tokenizer + model + decoding for every architecture. With it, every Hub model becomes a four-line script. The library is also the production runtime for huge swaths of inference traffic — TGI (Text Generation Inference), text-embeddings-inference, and most HF Spaces are Transformers-based."
      />
    </div>
  );
}

// ─── N60 — ONNX Runtime + Ecosystem map ──────────────────────────

function NodeONNX({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="ONNX Runtime"
        hint="The cross-framework inference engine. Convert a model from PyTorch or TF into the .onnx file format, then run it from any language on any hardware via ONNX Runtime."
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FactCard
          tag="The format"
          body=".onnx is a Protobuf describing the model graph + weights. It's framework-agnostic — once exported, the original PyTorch / TF code is no longer needed to run."
          color={VIZ.coral}
        />
        <FactCard
          tag="torch.onnx.export"
          body="One PyTorch call traces your model on a dummy input and emits .onnx. The .onnx file then runs in C++, Java, C#, Rust, Python, JS — wherever ONNX Runtime ships."
          color={VIZ.coral}
        />
        <FactCard
          tag="Execution providers"
          body="ORT picks the best backend per op: CUDA, CoreML, DirectML, TensorRT, OpenVINO. Same .onnx file runs faster on whatever hardware you're on without code changes."
          color={VIZ.coral}
        />
        <FactCard
          tag="When NOT to ONNX"
          body="If you have unusual control flow, custom ops, or unsupported dtypes, export can be painful. For pure transformers it's smooth; for research code with .item() everywhere, less so."
          color={VIZ.coral}
        />
      </div>
      <AskBlock
        provider={provider}
        setProvider={setProvider}
        color={VIZ.coral}
        presets={[
          'When does ONNX export make sense vs running PyTorch directly?',
          'What is an ONNX execution provider?',
          'Why is ONNX Runtime faster than the original framework on the same hardware?',
        ]}
        defaultQuestion="What does ONNX give me that PyTorch.compile does not?"
      />

      <EcosystemMap provider={provider} setProvider={setProvider} />

      <ExplainerBlock
        title="The deploy-anywhere layer"
        body="ONNX exists because you don't want to ship PyTorch inside an iOS app. The export step costs you some flexibility (no Python in the loop) and you give up some optimisations (a few PyTorch features don't translate), but you get a single artifact that runs in twelve runtimes on twenty hardware targets. For production inference that isn't huge LLMs, it's still the most portable path."
      />
    </div>
  );
}

// ─── Ecosystem map (lives inside N60) ────────────────────────────

type Framework = {
  name: string;
  layer: string;
  use_case: string;
  runs_on_top_of: string[];
  color_hint: string;
};

type MapResponse = {
  frameworks: Framework[];
  layers: string[];
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

function EcosystemMap({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (p: string) => void;
}) {
  const [result, setResult] = useState<MapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelected(null);
    try {
      const r = await fetch(`${API}/day12/framework-map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as MapResponse);
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
            The ML framework ecosystem
          </h3>
          <p className="mt-1 text-sm text-muted">
            Ask the model to lay out the stack: hardware &rarr; low-level
            engines &rarr; high-level wrappers &rarr; the Hub &rarr; runtimes.
            Click any card for its use case + what it sits on top of.
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
            {loading ? 'mapping…' : 'Show ecosystem map →'}
          </button>
        </div>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <FrameworkStack
          frameworks={result.frameworks}
          selected={selected}
          onSelect={setSelected}
        />
      )}
      {result && (
        <Footer>
          {result.provider} · {result.model} · {result.total_tokens} tok ·{' '}
          {result.latency_ms}ms
        </Footer>
      )}
    </div>
  );
}

function FrameworkStack({
  frameworks,
  selected,
  onSelect,
}: {
  frameworks: Framework[];
  selected: string | null;
  onSelect: (name: string | null) => void;
}) {
  const sel = selected
    ? frameworks.find((f) => f.name === selected) ?? null
    : null;

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {LAYER_STACK.map((layer) => {
          const inLayer = frameworks.filter((f) => f.layer === layer);
          const color = LAYER_COLOR[layer] ?? VIZ.grey;
          return (
            <li
              key={layer}
              className="grid grid-cols-1 gap-2 border bg-paper p-3 md:grid-cols-[140px_1fr]"
              style={{ borderLeft: `2px solid ${color}` }}
            >
              <div className="flex items-baseline gap-2 md:flex-col md:items-start">
                <div
                  className="font-mono text-[11px] uppercase tracking-[0.18em]"
                  style={{ color }}
                >
                  {LAYER_LABEL[layer] ?? layer}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted">
                  {inLayer.length} {inLayer.length === 1 ? 'item' : 'items'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {inLayer.length === 0 ? (
                  <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                    (none on this layer)
                  </span>
                ) : (
                  inLayer.map((f) => {
                    const fColor = COLOR_HINT[f.color_hint] ?? color;
                    const active = f.name === selected;
                    return (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() =>
                          onSelect(active ? null : f.name)
                        }
                        className="border px-2.5 py-1 font-mono text-[11px] transition"
                        style={{
                          borderColor: fColor,
                          color: active ? '#0c0a09' : fColor,
                          background: active ? fColor : 'transparent',
                        }}
                      >
                        {f.name}
                      </button>
                    );
                  })
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {sel && <SelectedFramework f={sel} />}
    </div>
  );
}

function SelectedFramework({ f }: { f: Framework }) {
  const color = COLOR_HINT[f.color_hint] ?? VIZ.grey;
  return (
    <div
      className="space-y-1.5 border bg-paper p-3"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="font-mono text-[11px] uppercase tracking-[0.18em]"
          style={{ color }}
        >
          {f.name}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
          {LAYER_LABEL[f.layer] ?? f.layer}
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-foreground/90">
        {f.use_case}
      </p>
      {f.runs_on_top_of.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
            runs on top of
          </span>
          {f.runs_on_top_of.map((dep) => (
            <span
              key={dep}
              className="border border-rule px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/70"
            >
              {dep}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
