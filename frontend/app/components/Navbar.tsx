'use client';

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

const DAYS = Array.from({ length: 10 }, (_, i) => i + 1);

function formatNum(n: number) {
  return n.toLocaleString();
}

function formatCost(c: number) {
  return `$${c.toFixed(4)}`;
}

export default function Navbar() {
  const pathname = usePathname();
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

  useEffect(() => {
    refetchProgress();
    setMenuOpen(false);
  }, [pathname, refetchProgress]);

  useEffect(() => {
    const handler = () => refetchProgress();
    window.addEventListener('progress:changed', handler);
    return () => window.removeEventListener('progress:changed', handler);
  }, [refetchProgress]);

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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-3 sm:gap-6 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
            <Link
              href="/day-01"
              className="flex shrink-0 items-center gap-2 font-serif text-base font-semibold tracking-tight"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              VAL
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
            <nav
              className="hidden min-w-0 items-center gap-1 overflow-x-auto sm:flex"
              style={{ scrollbarWidth: 'none' }}
              aria-label="Days"
            >
              {DAYS.map((d) => {
                const path = `/day-${String(d).padStart(2, '0')}`;
                const active = pathname === path;
                const done = doneDays.has(d);
                return (
                  <Link
                    key={d}
                    href={path}
                    aria-label={done ? `Day ${d} (completed)` : `Day ${d}`}
                    className={[
                      'inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-sm transition-colors',
                      active
                        ? done
                          ? 'bg-accent text-white'
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
                pathname === '/advanced-ai'
                  ? 'bg-accent text-white'
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
          <div className="mx-auto flex max-h-[calc(100vh-3.5rem)] max-w-5xl flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-3">
            <div className="px-1 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Days
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {DAYS.map((d) => {
                const path = `/day-${String(d).padStart(2, '0')}`;
                const active = pathname === path;
                const done = doneDays.has(d);
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
                          ? 'border-accent bg-accent text-white'
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
                    pathname === '/advanced-ai'
                      ? 'bg-accent text-white'
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
