'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Markdown } from '../components/Markdown';
import { useNodeProgress } from '../components/useNodeProgress';
import DayPager from '../components/DayPager';

const NODES = [
  { id: 'N46', label: 'MCP', title: 'Model context protocol (MCP)' },
  { id: 'N47', label: 'Safety', title: 'AI safety & ethics' },
  { id: 'N48', label: 'Multimodal', title: 'Multimodal AI' },
  { id: 'N49', label: 'Vision / DALL-E', title: 'OpenAI Vision + DALL-E' },
  { id: 'N50', label: 'Dev tools', title: 'AI development tools' },
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
const VISION_BADGE = 'openai · gpt-4o-mini';
const IMAGE_BADGE = 'openai · gpt-image-1';
const MOD_BADGE = 'openai · omni-moderation-latest';

export default function Day10Page() {
  const [activeId, setActiveId] = useState('N46');
  const progress = useNodeProgress(10);
  const isDone = (id: string) => progress.completedSet.has(id);
  const activeIsDone = isDone(activeId);

  return (
    <article className="space-y-10 lg:-mx-24 xl:-mx-40">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Day 10 · MCP + Safety + Multimodal
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
          The model sees, draws, and{' '}
          <span className="text-accent">behaves</span>.
        </h1>
        <p className="text-sm text-muted">
          The protocol that wires tools to any model, the safety net that
          watches what users say, and the multimodal endpoints that turn
          pixels into words and words into pixels. Each tab is N46–N50.
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

      <div className={activeId === 'N46' ? undefined : 'hidden'}>
        <NodeMCP />
      </div>
      <div className={activeId === 'N47' ? undefined : 'hidden'}>
        <NodeSafety />
      </div>
      <div className={activeId === 'N48' ? undefined : 'hidden'}>
        <NodeMultimodal />
      </div>
      <div className={activeId === 'N49' ? undefined : 'hidden'}>
        <NodeVisionAndImage />
      </div>
      <div className={activeId === 'N50' ? undefined : 'hidden'}>
        <NodeDevTools />
      </div>
      <DayPager day={10} />
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

function StaticBadge({ text, color }: { text: string; color: string }) {
  return (
    <div className="flex items-center justify-between border-b border-rule pb-3">
      <span className="font-mono text-xs uppercase tracking-wide text-muted">
        Model
      </span>
      <span
        className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
        style={{ borderColor: color, color, background: `${color}1F` }}
      >
        {text}
      </span>
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

// ─── N46 — Model Context Protocol ────────────────────────────────

const MCP_FLOW: { tag: string; sub: string; color: string }[] = [
  {
    tag: '1 · Host',
    sub: 'an LLM app (Claude Desktop, Cursor, this Day-9 agent)',
    color: VIZ.grey,
  },
  {
    tag: '2 · Client',
    sub: 'connector inside the host; speaks MCP to one server',
    color: VIZ.blue,
  },
  {
    tag: '3 · Server',
    sub: 'exposes tools, resources, prompts to any compatible host',
    color: VIZ.violet,
  },
  {
    tag: '4 · Resource',
    sub: 'real-world surface — filesystem, GitHub, Postgres, Slack…',
    color: VIZ.green,
  },
];

const MCP_REQUEST_EXAMPLE = `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": { "path": "/notes/today.md" }
  }
}`;

const MCP_RESPONSE_EXAMPLE = `{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      { "type": "text", "text": "# Today\\n- ship Day 10\\n- write changelog" }
    ]
  }
}`;

const MCP_VS_FUNCTION_CALLING: {
  k: string;
  fc: string;
  mcp: string;
}[] = [
  {
    k: 'Where tools live',
    fc: 'In your application code, hard-wired into one prompt',
    mcp: 'In a separate server, reusable across every MCP-aware host',
  },
  {
    k: 'Discovery',
    fc: 'You decide and list them statically in the request',
    mcp: 'Host asks the server "list tools" at startup, gets schema back',
  },
  {
    k: 'Sharing',
    fc: 'Copy-paste between projects',
    mcp: 'Same server plugs into Claude Desktop, Cursor, VS Code, …',
  },
  {
    k: 'Transport',
    fc: 'HTTP request body to the LLM',
    mcp: 'JSON-RPC 2.0 over stdio or HTTP, model-agnostic',
  },
];

function NodeMCP() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Model Context Protocol"
        hint="MCP is the USB-C for AI tools. Instead of every app hand-rolling its own function calls, an MCP server exposes tools / resources / prompts once, and any compatible host (Claude Desktop, Cursor, an agent runtime) can plug in."
      />

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          The four roles
        </div>
        <ol className="grid grid-cols-1 gap-2 md:grid-cols-4">
          {MCP_FLOW.map((s) => (
            <li
              key={s.tag}
              className="space-y-1 border bg-paper p-3"
              style={{ borderLeft: `2px solid ${s.color}` }}
            >
              <div
                className="font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: s.color }}
              >
                {s.tag}
              </div>
              <p className="text-[12px] leading-snug text-foreground/80">
                {s.sub}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          className="space-y-2 border bg-paper p-4"
          style={{ borderLeft: `2px solid ${VIZ.blue}` }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.blue }}
          >
            request — client → server
          </div>
          <pre className="overflow-x-auto whitespace-pre border border-rule bg-background p-2 font-mono text-[11px] leading-snug text-foreground/85">
            {MCP_REQUEST_EXAMPLE}
          </pre>
        </div>
        <div
          className="space-y-2 border bg-paper p-4"
          style={{ borderLeft: `2px solid ${VIZ.green}` }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.green }}
          >
            response — server → client
          </div>
          <pre className="overflow-x-auto whitespace-pre border border-rule bg-background p-2 font-mono text-[11px] leading-snug text-foreground/85">
            {MCP_RESPONSE_EXAMPLE}
          </pre>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          MCP vs raw function calling
        </div>
        <div className="overflow-x-auto border border-rule">
          <table className="w-full border-collapse text-[13px]">
            <thead className="bg-paper">
              <tr>
                <th className="border-b border-rule px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wide text-muted">
                  &nbsp;
                </th>
                <th
                  className="border-b border-rule px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wide"
                  style={{ color: VIZ.grey }}
                >
                  Raw function calling
                </th>
                <th
                  className="border-b border-rule px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wide"
                  style={{ color: VIZ.violet }}
                >
                  MCP
                </th>
              </tr>
            </thead>
            <tbody>
              {MCP_VS_FUNCTION_CALLING.map((row) => (
                <tr key={row.k} className="border-t border-rule">
                  <td className="px-3 py-2 align-top font-mono text-[11px] uppercase tracking-wide text-muted">
                    {row.k}
                  </td>
                  <td className="px-3 py-2 align-top text-foreground/85">
                    {row.fc}
                  </td>
                  <td className="px-3 py-2 align-top text-foreground/85">
                    {row.mcp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExplainerBlock
        title="Tools, once. Hosts, many."
        body="Day 9 wired three tools into our own agent loop — calculate, get_weather, search_web. With MCP, those same tools could live in a tiny server that the agent talks to over JSON-RPC. Then Claude Desktop, Cursor, the next agent runtime, and a future you-don't-know-yet host can all use them without re-implementing anything. The win is portability, not extra capability."
      />
    </div>
  );
}

// ─── N47 — Safety & ethics ─────────────────────────────────────────

type ModerateCategory = {
  category: string;
  flagged: boolean;
  score: number;
};

type ModerateResponse = {
  text: string;
  flagged: boolean;
  categories: ModerateCategory[];
  latency_ms: number;
  provider: string;
  model: string;
};

const SAFETY_PILLARS: { tag: string; color: string; body: string }[] = [
  {
    tag: 'Honesty',
    color: VIZ.green,
    body: 'The model says "I don\'t know" instead of fabricating. Calibrated answers, citations, retrieval over confidence.',
  },
  {
    tag: 'Harmlessness',
    color: VIZ.amber,
    body: 'Refuses to produce malware, abuse, CSAM, or weapons synthesis. Layered with moderation on the input AND output side.',
  },
  {
    tag: 'Helpfulness',
    color: VIZ.blue,
    body: 'A safe model that refuses everything is a useless model. The bar is to refuse only what is genuinely harmful, not what is awkward.',
  },
  {
    tag: 'Privacy',
    color: VIZ.violet,
    body: 'No leaking PII back, no training on private chats without consent, no echoing one user\'s data to another. Strict tenancy.',
  },
];

const MOD_PRESETS = [
  'I love this app and I want to tell my friends about it.',
  'I will hunt you down and hurt you for what you said yesterday.',
  'How do I make a pipe bomb?',
];

function NodeSafety() {
  const [text, setText] = useState(MOD_PRESETS[0]);
  const [result, setResult] = useState<ModerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day10/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as ModerateResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const topRows = result ? result.categories.slice(0, 6) : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI safety & ethics"
        hint="Two layers of safety: the model's own training (refuses unsafe asks) and a separate moderation classifier that scores every input/output across well-known categories. Below: send some text through OpenAI's omni-moderation classifier and watch the per-category bars."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {SAFETY_PILLARS.map((p) => (
          <div
            key={p.tag}
            className="space-y-1.5 border bg-paper p-3"
            style={{ borderLeft: `2px solid ${p.color}` }}
          >
            <div
              className="font-mono text-[11px] uppercase tracking-[0.18em]"
              style={{ color: p.color }}
            >
              {p.tag}
            </div>
            <p className="text-[12px] leading-snug text-foreground/80">
              {p.body}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4 border-t border-rule pt-6">
        <StaticBadge text={MOD_BADGE} color={VIZ.coral} />
        <div className="flex flex-wrap gap-2">
          {MOD_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setText(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              sample {i + 1}
            </button>
          ))}
        </div>
        <textarea aria-label="Form input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          rows={3}
          maxLength={4000}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <SubmitButton
          loading={loading}
          idle="Run moderation →"
          busy="Classifying…"
          disabled={loading || !text.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3">
          <div
            className="flex items-center justify-between border bg-paper p-3"
            style={{
              borderLeft: `2px solid ${result.flagged ? VIZ.red : VIZ.green}`,
            }}
          >
            <span
              className="font-mono text-[11px] uppercase tracking-[0.18em]"
              style={{ color: result.flagged ? VIZ.red : VIZ.green }}
            >
              {result.flagged ? 'flagged' : 'safe'}
            </span>
            <span className="font-mono text-[11px] text-muted">
              {result.latency_ms}ms
            </span>
          </div>
          <div className="space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              top {topRows.length} categories by score
            </div>
            {topRows.map((c) => (
              <CategoryBar key={c.category} row={c} />
            ))}
          </div>
          <Footer>
            {result.provider} · {result.model}
          </Footer>
        </div>
      )}

      <ExplainerBlock
        title="The classifier is a separate model"
        body="The moderation endpoint doesn't generate text; it returns a vector of category scores between 0 and 1. You decide the threshold: maybe 0.5 to block, 0.2 to log, anything lower to pass. The right pattern is to run moderation on both the user's input and the model's reply, and to log everything so you can tune thresholds against real traffic."
      />
    </div>
  );
}

function CategoryBar({ row }: { row: ModerateCategory }) {
  const pct = Math.max(0, Math.min(100, row.score * 100));
  const color = row.flagged ? VIZ.red : row.score > 0.1 ? VIZ.amber : VIZ.green;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 font-mono text-[11px] uppercase tracking-wide">
        <span className="text-foreground/80">{row.category}</span>
        <span style={{ color }}>
          {row.flagged ? 'flagged · ' : ''}
          {(row.score * 100).toFixed(2)}%
        </span>
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

// ─── N48 — Multimodal overview ────────────────────────────────────

const MODALITIES: {
  name: string;
  color: string;
  input: string;
  output: string;
  examples: string[];
}[] = [
  {
    name: 'Text ↔ Text',
    color: VIZ.grey,
    input: 'Everything we did Days 1–9',
    output: 'String in, string out',
    examples: ['chat', 'RAG', 'classification', 'agents'],
  },
  {
    name: 'Image → Text (vision)',
    color: VIZ.blue,
    input: 'PNG / JPEG / data URL',
    output: 'Description, OCR, structured fields',
    examples: ['gpt-4o-mini', 'claude-3.5-sonnet', 'gemini-2.5-flash'],
  },
  {
    name: 'Text → Image (gen)',
    color: VIZ.violet,
    input: 'Prompt + size + style hints',
    output: 'Generated PNG URL',
    examples: ['dall-e-2 / 3', 'gpt-image-1', 'stable diffusion'],
  },
  {
    name: 'Audio ↔ Text',
    color: VIZ.amber,
    input: 'WAV/MP3 (in) or text (out)',
    output: 'Transcript, translation, or speech',
    examples: ['whisper-1', 'tts-1', 'realtime API'],
  },
  {
    name: 'Video → Text',
    color: VIZ.coral,
    input: 'MP4 / sampled frames',
    output: 'Scene description, action summary',
    examples: ['gemini-2.5-pro', 'sampled frames into gpt-4o-mini'],
  },
];

function NodeMultimodal() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Multimodal AI"
        hint="A multimodal model accepts and/or produces more than just text. Pick a row, look at what goes in vs. what comes out — the API shape stays familiar; you just pass a different content block."
      />

      <div className="overflow-x-auto border border-rule">
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-paper">
            <tr>
              <th className="border-b border-rule px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wide text-muted">
                Modality
              </th>
              <th className="border-b border-rule px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wide text-muted">
                Input
              </th>
              <th className="border-b border-rule px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wide text-muted">
                Output
              </th>
              <th className="border-b border-rule px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wide text-muted">
                Common models
              </th>
            </tr>
          </thead>
          <tbody>
            {MODALITIES.map((m) => (
              <tr key={m.name} className="border-t border-rule align-top">
                <td
                  className="px-3 py-2 font-mono text-[12px] uppercase tracking-wide"
                  style={{ color: m.color }}
                >
                  {m.name}
                </td>
                <td className="px-3 py-2 text-foreground/85">{m.input}</td>
                <td className="px-3 py-2 text-foreground/85">{m.output}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {m.examples.map((e) => (
                      <span
                        key={e}
                        className="border px-1.5 py-0.5 font-mono text-[10px]"
                        style={{
                          borderColor: m.color,
                          color: m.color,
                          background: `${m.color}1F`,
                        }}
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExplainerBlock
        title="The content block is the trick"
        body="OpenAI-compatible chat APIs accept an array of content blocks per message: {type: 'text', text: '…'}, {type: 'image_url', image_url: {url: '…'}}, and so on. The model 'just' attends across all of them. The next tab puts that to work — pass an image URL or upload a file and watch gpt-4o-mini describe it."
      />
    </div>
  );
}

// ─── N49 — Vision + DALL-E ────────────────────────────────────────

type DescribeResponse = {
  description: string;
  tags: string[];
  raw: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  provider: string;
  model: string;
};

type GenerateResponse = {
  prompt: string;
  size: string;
  quality: string;
  image_url: string;
  latency_ms: number;
  cost_usd: number;
  provider: string;
  model: string;
};

const DESCRIBE_PRESET_URLS = [
  'https://picsum.photos/seed/val-cat/640/480',
  'https://picsum.photos/seed/val-mountain/640/480',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=640',
];

const GENERATE_PRESETS = [
  'A cozy reading nook with a cat sleeping on a stack of books, warm afternoon light, watercolor style.',
  'An isometric pixel-art diagram of a tiny vector database with glowing blue rows.',
  'A 1970s polaroid-style photo of a robot eating ramen at a Tokyo street stall.',
];

function NodeVisionAndImage() {
  return (
    <div className="space-y-10">
      <SectionHeader
        title="OpenAI Vision + DALL-E"
        hint="Two complementary endpoints. The chat completions API with image content blocks turns pixels into a description; the images.generate endpoint turns a prompt into pixels."
      />
      <DescribeImage />
      <div className="border-t border-rule" />
      <GenerateImage />
    </div>
  );
}

function DescribeImage() {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState(DESCRIBE_PRESET_URLS[0]);
  const [question, setQuestion] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [result, setResult] = useState<DescribeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFilePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFilePreview(String(reader.result || ''));
    reader.readAsDataURL(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (mode === 'url') {
        if (!url.trim()) throw new Error('image_url is required');
        const r = await fetch(`${API}/day10/describe-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: url.trim(),
            question: question.trim() || null,
          }),
        });
        if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
        setResult((await r.json()) as DescribeResponse);
      } else {
        const f = fileRef.current?.files?.[0];
        if (!f) throw new Error('pick a file first');
        const form = new FormData();
        form.append('file', f);
        if (question.trim()) form.append('question', question.trim());
        const r = await fetch(`${API}/day10/describe-upload`, {
          method: 'POST',
          body: form,
        });
        if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
        setResult((await r.json()) as DescribeResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const previewSrc = mode === 'url' ? url : filePreview;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Image → text describer
        </h3>
        <p className="text-sm text-muted">
          Pass a URL or upload a file; gpt-4o-mini writes a paragraph + a tag
          list.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['url', 'upload'] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setResult(null);
                setError(null);
              }}
              className="border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition"
              style={{
                borderColor: active ? VIZ.blue : 'var(--rule)',
                color: active ? VIZ.blue : undefined,
                background: active ? `${VIZ.blue}14` : undefined,
              }}
            >
              {m === 'url' ? 'image URL' : 'upload file'}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <StaticBadge text={VISION_BADGE} color={VIZ.blue} />
        {mode === 'url' ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {DESCRIBE_PRESET_URLS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setUrl(p)}
                  disabled={loading}
                  className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
                >
                  preset {i + 1}
                </button>
              ))}
            </div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              placeholder="https://…"
              className="w-full border border-rule bg-paper p-2.5 font-mono text-sm outline-none focus:border-accent"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              image (max 4 MB)
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              disabled={loading}
              className="w-full border border-rule bg-paper p-2.5 text-sm outline-none file:mr-3 file:rounded-none file:border file:border-rule file:bg-paper file:px-2 file:py-1 file:font-mono file:text-[11px] file:uppercase file:text-foreground/70"
            />
          </div>
        )}
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            question (optional — defaults to &ldquo;describe what you see&rdquo;)
          </span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            placeholder="Optional: ask a specific question about the image"
            className="w-full border border-rule bg-paper p-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <SubmitButton
          loading={loading}
          idle="Describe →"
          busy="Looking…"
          disabled={
            loading ||
            (mode === 'url' && !url.trim()) ||
            (mode === 'upload' && !filePreview)
          }
        />
      </form>
      {error && <ErrorBox message={error} />}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          className="space-y-2 border bg-paper p-3"
          style={{ borderTop: `2px solid ${VIZ.blue}` }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.blue }}
          >
            input image
          </div>
          {previewSrc ? (
            <ImagePreview src={previewSrc} alt="input preview" />
          ) : (
            <div className="border border-dashed border-rule bg-background p-4 text-center text-[12px] text-muted">
              No image yet
            </div>
          )}
        </div>
        <div
          className="space-y-2 border bg-paper p-3"
          style={{ borderTop: `2px solid ${VIZ.green}` }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.green }}
          >
            description
          </div>
          {loading ? (
            <div className="font-mono text-xs uppercase tracking-wide text-muted">
              looking…
            </div>
          ) : result ? (
            <div className="space-y-2">
              <div className="text-[13px] leading-relaxed text-foreground/90">
                <Markdown text={result.description} />
              </div>
              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {result.tags.map((t) => (
                    <span
                      key={t}
                      className="border border-rule px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <Footer>
                {result.provider} · {result.model} · {result.total_tokens} tok
                · {result.latency_ms}ms
              </Footer>
            </div>
          ) : (
            <div className="text-[12px] text-muted">
              Submit to see the description.
            </div>
          )}
        </div>
      </div>

      <ExplainerBlock
        title="Vision is just another content block"
        body={
          "The model call looks like a normal chat completion — same endpoint, same response shape. The only difference is the user message: instead of a string, it's a list of content blocks, one of which is { type: 'image_url', image_url: { url: '…' } }. Upload mode just base64-encodes the file into a data URL and sends the same block."
        }
      />
    </div>
  );
}

type ImageSize = '1024x1024' | '1024x1536' | '1536x1024';
type ImageQuality = 'low' | 'medium' | 'high';

const SIZE_OPTIONS: ImageSize[] = ['1024x1024', '1024x1536', '1536x1024'];
const QUALITY_OPTIONS: { id: ImageQuality; cost: number }[] = [
  { id: 'low', cost: 0.011 },
  { id: 'medium', cost: 0.042 },
  { id: 'high', cost: 0.167 },
];

function GenerateImage() {
  const [prompt, setPrompt] = useState(GENERATE_PRESETS[0]);
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [quality, setQuality] = useState<ImageQuality>('low');
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/day10/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size, quality }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      setResult((await r.json()) as GenerateResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-serif text-xl font-semibold">
          Text → image generator
        </h3>
        <p className="text-sm text-muted">
          gpt-image-1 — billed per quality tier (low $0.011, medium $0.042,
          high $0.167). The API returns base64; the backend wraps it in a
          data URL so it renders inline.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <StaticBadge text={IMAGE_BADGE} color={VIZ.violet} />
        <div className="flex flex-wrap gap-2">
          {GENERATE_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(p)}
              disabled={loading}
              className="border border-rule px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground/70 transition hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              prompt {i + 1}
            </button>
          ))}
        </div>
        <textarea aria-label="Form input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          rows={3}
          maxLength={1000}
          className="w-full border border-rule bg-paper p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            size
          </span>
          {SIZE_OPTIONS.map((s) => {
            const active = size === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                disabled={loading}
                className="border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition disabled:opacity-40"
                style={{
                  borderColor: active ? VIZ.violet : 'var(--rule)',
                  color: active ? VIZ.violet : undefined,
                  background: active ? `${VIZ.violet}14` : undefined,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            quality
          </span>
          {QUALITY_OPTIONS.map((q) => {
            const active = quality === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setQuality(q.id)}
                disabled={loading}
                className="border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition disabled:opacity-40"
                style={{
                  borderColor: active ? VIZ.violet : 'var(--rule)',
                  color: active ? VIZ.violet : undefined,
                  background: active ? `${VIZ.violet}14` : undefined,
                }}
              >
                {q.id} · ${q.cost.toFixed(3)}
              </button>
            );
          })}
        </div>
        <SubmitButton
          loading={loading}
          idle="Generate image →"
          busy="Drawing…"
          disabled={loading || !prompt.trim()}
        />
      </form>
      {error && <ErrorBox message={error} />}

      {(result || loading) && (
        <div
          className="space-y-2 border bg-paper p-3"
          style={{ borderTop: `2px solid ${VIZ.violet}` }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: VIZ.violet }}
          >
            {loading ? 'generating…' : 'generated image'}
          </div>
          {loading ? (
            <div className="border border-dashed border-rule bg-background p-8 text-center font-mono text-xs uppercase tracking-wide text-muted">
              waiting on gpt-image-1…
            </div>
          ) : result ? (
            <div className="space-y-2">
              <ImagePreview src={result.image_url} alt={result.prompt} />
              <p className="text-[12px] italic text-muted">“{result.prompt}”</p>
              <Footer>
                {result.provider} · {result.model} · {result.size} ·{' '}
                {result.quality} · ${result.cost_usd.toFixed(4)}/image ·{' '}
                {result.latency_ms}ms
              </Footer>
            </div>
          ) : null}
        </div>
      )}

      <ExplainerBlock
        title="Generation is fire-and-forget"
        body="There is no streaming, no tool loop — you POST a prompt, you get an image. gpt-image-1 returns base64; the backend wraps it in a data URL so the <img> tag renders without an extra fetch. Cost scales with the quality tier you pick (low $0.011 → high $0.167 per image at 1024×1024), so tier choice matters far more than size choice for the bill."
      />
    </div>
  );
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full overflow-hidden border border-rule bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="block max-h-105 w-full object-contain"
      />
    </div>
  );
}

// ─── N50 — Dev tools ──────────────────────────────────────────────

const DEV_TOOLS: {
  name: string;
  color: string;
  shape: string;
  good_for: string;
  trade_off: string;
}[] = [
  {
    name: 'Claude Code',
    color: VIZ.coral,
    shape:
      'Anthropic CLI agent. Lives in your terminal, edits files via tool calls, runs commands.',
    good_for:
      'Large multi-file refactors, autonomous "go fix X" runs, agentic loops with hooks.',
    trade_off:
      'Terminal-first; less visual feedback than an IDE plugin. Best when you trust agents.',
  },
  {
    name: 'Cursor',
    color: VIZ.blue,
    shape:
      'A VS Code fork with model context built in. Ctrl-K for inline edits, Ctrl-L for chat.',
    good_for:
      'Editor-driven flow: see diffs, accept hunks, keep your normal keymaps.',
    trade_off:
      'Locked to a VS Code fork. Less great for long-running autonomous tasks.',
  },
  {
    name: 'Aider',
    color: VIZ.amber,
    shape:
      'Open-source terminal pair-programmer. Git-aware diffs, BYOK across many providers.',
    good_for:
      'Provider-agnostic workflows. Clean commit-per-change history out of the box.',
    trade_off:
      'CLI-only; no IDE polish. Smaller agent toolbox than Claude Code.',
  },
  {
    name: 'Gemini CLI',
    color: VIZ.violet,
    shape:
      'Google CLI agent backed by Gemini 2.x. Free tier with high rate limits.',
    good_for:
      'Free experimentation, very long context windows (Gemini 1M+ tokens).',
    trade_off:
      'Newer ecosystem; tool/integration story still maturing vs Cursor / Claude Code.',
  },
];

function NodeDevTools() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI development tools"
        hint="The tools you'll actually live in once the curriculum ends. Four shapes — agentic CLI, AI-first IDE, BYOK pair-programmer, free CLI from Google — covering the practical spectrum in 2026."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {DEV_TOOLS.map((t) => (
          <div
            key={t.name}
            className="space-y-2 border bg-paper p-4"
            style={{
              borderTopColor: t.color,
              borderRightColor: t.color,
              borderBottomColor: t.color,
              borderLeftColor: t.color,
              borderLeftWidth: 2,
            }}
          >
            <div
              className="font-mono text-[11px] uppercase tracking-[0.18em]"
              style={{ color: t.color }}
            >
              {t.name}
            </div>
            <p className="text-[13px] leading-relaxed text-foreground/85">
              {t.shape}
            </p>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-0.5 text-[12px]">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted">
                  good for
                </dt>
                <dd className="text-foreground/85">{t.good_for}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted">
                  trade-off
                </dt>
                <dd className="text-foreground/85">{t.trade_off}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div
        className="space-y-2 border bg-paper p-4"
        style={{ borderLeft: `2px solid ${VIZ.green}` }}
      >
        <div
          className="font-mono text-[11px] uppercase tracking-[0.18em]"
          style={{ color: VIZ.green }}
        >
          You built this with…
        </div>
        <p className="text-sm leading-relaxed text-foreground/85">
          This whole roadmap — backend + frontend, 10 days, 50 nodes — was
          implemented day-by-day with Claude Code editing files and running
          checks in this very repo. Look in <code>CHANGELOG.md</code> for the
          dated build log. You can do the same with any of the tools above on
          your next project; the workflow generalizes.
        </p>
      </div>

      <ExplainerBlock
        title="The meta-lesson"
        body="In 2026 the bottleneck for shipping software is rarely typing speed. It's deciding clearly what to build, then keeping the agent on rails while it does the typing. Every tool above is a different angle on the same trade-off: how much agency you grant, how much you watch. Start with whichever sits closest to your existing workflow, switch when you actually feel pain — not because of hype."
      />

      <div className="border-t border-rule pt-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          50 / 50 — roadmap complete
        </p>
        <p className="mt-1 text-sm text-muted">
          Tokens, embeddings, prompts, models, vector DBs, RAG, agents, MCP,
          multimodal. You built every one. Go ship something.
        </p>
      </div>
    </div>
  );
}

// Suppress unused-import warning if Image is not used (kept for future).
void Image;
