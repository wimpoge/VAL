'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type ProviderBucket = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  calls: number;
};

type TokenSummary = {
  total_tokens: number;
  total_cost_usd: number;
  call_count: number;
  by_provider: Record<string, ProviderBucket>;
};

type DayProgress = { day: number; done: number; total: number };
type ProgressResponse = { by_day: DayProgress[] };

const BEGINNER_DAYS = Array.from({ length: 10 }, (_, i) => i + 1);
const ADVANCED_DAYS = Array.from({ length: 10 }, (_, i) => i + 11);
// Advanced days that have a real page on disk. Day 12-20 are listed but
// disabled until their pages land — keeping them visible so the user sees
// the roadmap at a glance rather than a single lonely Day 11 chip.
const ADVANCED_LIVE = new Set<number>([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);

function dayHref(day: number, advanced: boolean): string {
  return advanced ? `/advanced-ai/day-${day}` : `/day-${String(day).padStart(2, '0')}`;
}

function formatNum(n: number) {
  return n.toLocaleString();
}

function formatCost(c: number) {
  return `$${c.toFixed(4)}`;
}

export default function Navbar() {
  const pathname = usePathname();
  const inAdvanced = pathname.startsWith('/advanced-ai');
  // On the /advanced-ai index page itself, the cards already show day status
  // and the chip strip would just duplicate that. Hide it there. Show it again
  // once the user clicks into a specific day so they can quick-switch.
  const onAdvancedIndex = pathname === '/advanced-ai';
  const showDayChips = !onAdvancedIndex;
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [doneDays, setDoneDays] = useState<Set<number>>(new Set());
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: Event) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (menuButtonRef.current && menuButtonRef.current.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [menuOpen]);

  const refetch = useCallback(async () => {
    try {
      const r = await fetch('http://localhost:8000/tokens');
      if (!r.ok) return;
      setSummary(await r.json());
    } catch {
      setSummary(null);
    }
  }, []);

  const refetchProgress = useCallback(async () => {
    try {
      const r = await fetch('http://localhost:8000/progress');
      if (!r.ok) return;
      const j = (await r.json()) as ProgressResponse;
      setDoneDays(
        new Set(
          j.by_day
            .filter((d) => d.total > 0 && d.done >= d.total)
            .map((d) => d.day),
        ),
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refetch();
    refetchProgress();
    const id = setInterval(() => {
      refetch();
      refetchProgress();
    }, 30_000);
    return () => clearInterval(id);
  }, [refetch, refetchProgress]);

  // Close the mobile menu when the route changes.
  // Note: we do NOT refetch progress here — initial mount is covered by the
  // 30s-poll effect above, in-app toggles emit 'progress:changed' (handled
  // below), and tab-refocus / network-online events also force a refetch.
  // Refetching on every pathname change would just duplicate work.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => refetchProgress();
    window.addEventListener('progress:changed', handler);
    return () => window.removeEventListener('progress:changed', handler);
  }, [refetchProgress]);

  // Refetch when the user returns to the tab or the network comes back —
  // catches the "marked complete in another tab" + "Postgres was briefly
  // down" cases where doneDays would otherwise stay stale until the 30s
  // poll cycles.
  useEffect(() => {
    const onFocus = () => {
      refetch();
      refetchProgress();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, [refetch, refetchProgress]);

  const reset = async () => {
    try {
      await fetch('http://localhost:8000/tokens/reset', { method: 'DELETE' });
      refetch();
    } catch {
      /* ignore */
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-3 sm:gap-6 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
            <Link
              href="/day-01"
              aria-label="VAL — Visual AI Learning"
              className="flex shrink-0 items-center"
            >
              <Image
                src="/text_logo.png"
                alt="VAL — Visual AI Learning"
                width={1152}
                height={768}
                priority
                className="h-14 w-auto"
              />
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((m) => !m)}
              aria-expanded={menuOpen}
              aria-label="Open day navigation"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-rule text-foreground/80 hover:bg-foreground hover:text-background sm:hidden"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
              >
                <path
                  d="M1 3h12M1 7h12M1 11h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {showDayChips && (
            <nav
              className="hidden min-w-0 items-center gap-1 overflow-x-auto sm:flex"
              style={{ scrollbarWidth: 'none' }}
              aria-label={inAdvanced ? 'Advanced days' : 'Days'}
            >
              {(inAdvanced ? ADVANCED_DAYS : BEGINNER_DAYS).map((d) => {
                const path = dayHref(d, inAdvanced);
                const active = pathname === path;
                const done = doneDays.has(d);
                const live = !inAdvanced || ADVANCED_LIVE.has(d);
                if (!live) {
                  return (
                    <span
                      key={d}
                      aria-label={`Day ${d} (planned)`}
                      aria-disabled="true"
                      title="Planned"
                      className="inline-flex shrink-0 cursor-not-allowed items-center gap-1 rounded px-2 py-1 text-sm text-foreground/30"
                    >
                      <span>{d}</span>
                    </span>
                  );
                }
                return (
                  <Link
                    key={d}
                    href={path}
                    aria-label={done ? `Day ${d} (completed)` : `Day ${d}`}
                    className={[
                      'inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-sm transition-colors',
                      active
                        ? done
                          ? 'bg-accent text-background'
                          : 'bg-foreground text-background'
                        : done
                          ? 'text-accent hover:bg-accent/10'
                          : 'text-foreground/70 hover:text-foreground',
                    ].join(' ')}
                  >
                    <span>{d}</span>
                    {done && (
                      <span
                        aria-hidden
                        className={[
                          'text-[10px] leading-none',
                          active ? 'text-white' : 'text-accent',
                        ].join(' ')}
                      >
                        ✓
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/usage"
              className={[
                'hidden rounded px-2.5 py-1 text-sm transition-colors sm:inline-block',
                pathname === '/usage'
                  ? 'bg-foreground text-background'
                  : 'text-foreground/70 hover:text-foreground',
              ].join(' ')}
            >
              Usage
            </Link>
            <Link
              href="/advanced-ai"
              className={[
                'hidden rounded px-2.5 py-1 text-sm transition-colors sm:inline-block',
                pathname.startsWith('/advanced-ai')
                  ? 'bg-accent text-background'
                  : 'text-accent hover:bg-accent/10',
              ].join(' ')}
            >
              Advanced
            </Link>
            {summary && (
              <button
                onClick={() => setOpen((o) => !o)}
                className="rounded border border-rule bg-paper px-3 py-1 font-mono text-xs hover:bg-foreground hover:text-background"
                aria-expanded={open}
              >
                {formatNum(summary.total_tokens)} tok ·{' '}
                {formatCost(summary.total_cost_usd)}
              </button>
            )}
          </div>
        </div>
      {menuOpen && (
        <div
          ref={menuRef}
          className="border-t border-rule bg-paper sm:hidden"
        >
          <div className="mx-auto flex max-h-[calc(100vh-4rem)] max-w-5xl flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-3">
            {showDayChips && (
            <div className="px-1 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              {inAdvanced ? 'Advanced days' : 'Days'}
            </div>
            )}
            {showDayChips && (
            <div className="grid grid-cols-5 gap-1.5">
              {(inAdvanced ? ADVANCED_DAYS : BEGINNER_DAYS).map((d) => {
                const path = dayHref(d, inAdvanced);
                const active = pathname === path;
                const done = doneDays.has(d);
                const live = !inAdvanced || ADVANCED_LIVE.has(d);
                if (!live) {
                  return (
                    <span
                      key={d}
                      aria-label={`Day ${d} (planned)`}
                      aria-disabled="true"
                      title="Planned"
                      className="inline-flex cursor-not-allowed items-center justify-center gap-1 rounded border border-rule px-2 py-2 text-sm text-foreground/30"
                    >
                      <span>{d}</span>
                    </span>
                  );
                }
                return (
                  <Link
                    key={d}
                    href={path}
                    onClick={() => setMenuOpen(false)}
                    aria-label={done ? `Day ${d} (completed)` : `Day ${d}`}
                    className={[
                      'inline-flex items-center justify-center gap-1 rounded border px-2 py-2 text-sm transition-colors',
                      active
                        ? done
                          ? 'border-accent bg-accent text-background'
                          : 'border-foreground bg-foreground text-background'
                        : done
                          ? 'border-accent/40 text-accent hover:bg-accent/10'
                          : 'border-rule text-foreground/80 hover:border-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    <span>{d}</span>
                    {done && (
                      <span
                        aria-hidden
                        className={[
                          'text-[10px] leading-none',
                          active ? 'text-white' : 'text-accent',
                        ].join(' ')}
                      >
                        ✓
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            )}
            <div className="mt-3 border-t border-rule pt-3">
              <div className="px-1 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                More
              </div>
              <div className="flex flex-col gap-1">
                <Link
                  href="/usage"
                  onClick={() => setMenuOpen(false)}
                  className={[
                    'rounded px-3 py-2 text-sm transition-colors',
                    pathname === '/usage'
                      ? 'bg-foreground text-background'
                      : 'text-foreground/80 hover:bg-foreground/10 hover:text-foreground',
                  ].join(' ')}
                >
                  Usage
                </Link>
                <Link
                  href="/advanced-ai"
                  onClick={() => setMenuOpen(false)}
                  className={[
                    'rounded px-3 py-2 text-sm transition-colors',
                    pathname.startsWith('/advanced-ai')
                      ? 'bg-accent text-background'
                      : 'text-accent hover:bg-accent/10',
                  ].join(' ')}
                >
                  Advanced
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      {open && summary && (
        <div className="border-t border-rule bg-paper">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-semibold">
                Usage by provider
              </h3>
              <button
                onClick={reset}
                className="text-xs text-accent hover:underline"
                title="Reset"
              >
                × reset
              </button>
            </div>
            {(() => {
              const used = Object.entries(summary.by_provider).filter(
                ([, b]) => b.total_tokens > 0,
              );
              if (used.length === 0) {
                return (
                  <p className="font-mono text-xs uppercase tracking-wide text-muted">
                    No usage yet.
                  </p>
                );
              }
              return (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {used.map(([p, b]) => (
                    <div
                      key={p}
                      className="flex items-center justify-between border border-rule px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-xs uppercase tracking-wide text-muted">
                        {p}
                      </span>
                      <span className="text-foreground/80">
                        {formatNum(b.total_tokens)} tok
                      </span>
                      <span className="font-mono text-xs text-muted">
                        {formatCost(b.cost_usd)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </header>
  );
}
