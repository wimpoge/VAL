import Link from 'next/link';

// Day 1-10 are the beginner curriculum. Day 11+ live under /advanced-ai/.
const BEGINNER_LAST = 10;
const ADVANCED_FIRST = 11;
const ADVANCED_LAST = 20;

// Mirror of frontend/app/components/Navbar.tsx — advanced days that have a
// real page on disk. Days outside this set render as a disabled "Planned"
// pill so the user understands the boundary instead of clicking into a 404.
const ADVANCED_LIVE = new Set<number>([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);

const BEGINNER_TOPICS: Record<number, string> = {
  1: 'Intro + LLM Basics',
  2: 'Core LLM Concepts',
  3: 'Prompt Engineering',
  4: 'Prompt Engineering Advanced',
  5: 'AI Models',
  6: 'Embeddings',
  7: 'Vector Databases',
  8: 'RAG',
  9: 'AI Agents',
  10: 'MCP + Safety + Multimodal',
};

const ADVANCED_TOPICS: Record<number, string> = {
  11: 'Vector DB Landscape',
  12: 'ML Frameworks',
  13: 'Cloud AI Platforms',
  14: 'Local Model Inference',
  15: 'Observability & Evals',
  16: 'LLM Frameworks',
  17: 'Production & Deployment',
  18: 'Advanced AI Topics',
  19: 'AI Business & Products',
  20: 'Capstone — Build Your AI App',
};

function basicHref(day: number): string {
  return `/day-${String(day).padStart(2, '0')}`;
}

function advancedHref(day: number): string {
  return `/advanced-ai/day-${day}`;
}

type NeighborState =
  | { kind: 'link'; label: string; topic: string; href: string }
  | { kind: 'planned'; label: string; topic: string }
  | null;

function prevOf(day: number, advanced: boolean): NeighborState {
  if (advanced) {
    // Day 11 is the first advanced day — there's no advanced "previous".
    // Falling back to Day 10 (last basic) feels wrong because the chip nav
    // and Advanced button already separate the tracks. Just disable.
    if (day <= ADVANCED_FIRST) return null;
    const prev = day - 1;
    return {
      kind: 'link',
      label: `Day ${prev}`,
      topic: ADVANCED_TOPICS[prev] ?? '',
      href: advancedHref(prev),
    };
  }
  if (day <= 1) return null;
  const prev = day - 1;
  return {
    kind: 'link',
    label: `Day ${prev}`,
    topic: BEGINNER_TOPICS[prev] ?? '',
    href: basicHref(prev),
  };
}

function nextOf(day: number, advanced: boolean): NeighborState {
  if (advanced) {
    if (day >= ADVANCED_LAST) return null;
    const next = day + 1;
    const topic = ADVANCED_TOPICS[next] ?? '';
    if (!ADVANCED_LIVE.has(next)) {
      return { kind: 'planned', label: `Day ${next}`, topic };
    }
    return {
      kind: 'link',
      label: `Day ${next}`,
      topic,
      href: advancedHref(next),
    };
  }
  if (day >= BEGINNER_LAST) {
    // Cap the basic track at Day 10. The "Advanced" button in the navbar
    // is the explicit hop into the next track; we don't auto-bridge so the
    // beginner experience stays linear and predictable.
    return null;
  }
  const next = day + 1;
  return {
    kind: 'link',
    label: `Day ${next}`,
    topic: BEGINNER_TOPICS[next] ?? '',
    href: basicHref(next),
  };
}

export default function DayPager({
  day,
  advanced = false,
}: {
  day: number;
  advanced?: boolean;
}) {
  const prev = prevOf(day, advanced);
  const next = nextOf(day, advanced);

  return (
    <nav
      aria-label="Day navigation"
      className="grid grid-cols-2 gap-3 border-t border-rule pt-6"
    >
      <Slot side="prev" neighbor={prev} />
      <Slot side="next" neighbor={next} />
    </nav>
  );
}

function Slot({
  side,
  neighbor,
}: {
  side: 'prev' | 'next';
  neighbor: NeighborState;
}) {
  const isNext = side === 'next';
  const baseClasses = [
    'group flex flex-col gap-1 border bg-paper p-3 transition',
    isNext ? 'items-end text-right' : 'items-start text-left',
  ].join(' ');

  if (neighbor === null) {
    return (
      <span
        aria-hidden
        className={[baseClasses, 'border-rule/60 opacity-40'].join(' ')}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {isNext ? 'next →' : '← previous'}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
          {isNext ? 'end of track' : 'start of track'}
        </span>
      </span>
    );
  }

  if (neighbor.kind === 'planned') {
    return (
      <span
        aria-disabled="true"
        title="Planned — page not built yet"
        className={[
          baseClasses,
          'cursor-not-allowed border-rule/60 opacity-60',
        ].join(' ')}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {isNext ? 'next →' : '← previous'}
        </span>
        <span className="flex items-baseline gap-2">
          <span className="font-serif text-base font-semibold text-foreground/60">
            {neighbor.label}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wide text-muted">
            planned
          </span>
        </span>
        {neighbor.topic && (
          <span className="text-[11px] text-muted">{neighbor.topic}</span>
        )}
      </span>
    );
  }

  return (
    <Link
      href={neighbor.href}
      className={[
        baseClasses,
        'border-rule hover:border-accent hover:bg-paper/80',
      ].join(' ')}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
        {isNext ? 'next →' : '← previous'}
      </span>
      <span className="font-serif text-base font-semibold text-foreground transition-colors group-hover:text-accent">
        {neighbor.label}
      </span>
      {neighbor.topic && (
        <span className="text-[11px] text-muted">{neighbor.topic}</span>
      )}
    </Link>
  );
}
