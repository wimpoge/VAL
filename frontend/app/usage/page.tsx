'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNodeProgress } from '../components/useNodeProgress';

type DailyRow = {
  date: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  calls: number;
};

type MonthlyRow = {
  month: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  calls: number;
};

type DailyResponse = { days: number; rows: DailyRow[]; available: boolean };
type MonthlyResponse = {
  months: number;
  rows: MonthlyRow[];
  available: boolean;
};

const PROVIDERS = ['openai', 'groq', 'deepseek', 'gemini'] as const;
type ProviderId = (typeof PROVIDERS)[number];

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#22c55e',
  groq: '#f59e0b',
  deepseek: '#3b82f6',
  gemini: '#a855f7',
};

const RANGES = [
  { id: '1', label: 'Today', days: 1 },
  { id: '7', label: 'Last 7d', days: 7 },
  { id: '30', label: 'Last 30d', days: 30 },
  { id: '90', label: 'Last 90d', days: 90 },
  { id: '365', label: 'All', days: 365 },
] as const;
type RangeId = (typeof RANGES)[number]['id'];

function formatNum(n: number) {
  return n.toLocaleString();
}

function formatCost(c: number) {
  if (c === 0) return '$0';
  if (c < 0.01) return `$${c.toFixed(4)}`;
  return `$${c.toFixed(2)}`;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rangeStartISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function UsagePage() {
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [monthly, setMonthly] = useState<MonthlyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [rangeId, setRangeId] = useState<RangeId>('30');
  const [enabledProviders, setEnabledProviders] = useState<Set<ProviderId>>(
    new Set(PROVIDERS),
  );
  const [pickedDate, setPickedDate] = useState<string>('');

  const progress = useNodeProgress();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('http://localhost:8000/usage/daily?days=365').then((r) => r.json()),
      fetch('http://localhost:8000/usage/monthly?months=12').then((r) => r.json()),
    ])
      .then(([d, m]) => {
        if (cancelled) return;
        setDaily(d);
        setMonthly(m);
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const range = RANGES.find((r) => r.id === rangeId)!;
  const startISO = pickedDate || rangeStartISO(range.days);
  const endISO = pickedDate || todayISO();

  const filteredDaily = useMemo(() => {
    if (!daily) return [];
    return daily.rows.filter((r) => {
      if (!enabledProviders.has(r.provider as ProviderId)) return false;
      if (r.date < startISO) return false;
      if (r.date > endISO) return false;
      return true;
    });
  }, [daily, enabledProviders, startISO, endISO]);

  const filteredMonthly = useMemo(() => {
    if (!monthly) return [];
    return monthly.rows.filter((r) =>
      enabledProviders.has(r.provider as ProviderId),
    );
  }, [monthly, enabledProviders]);

  const dailyByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        total: number;
        cost: number;
        calls: number;
        byProvider: Record<string, number>;
      }
    >();
    for (const r of filteredDaily) {
      const cur = map.get(r.date) ?? {
        date: r.date,
        total: 0,
        cost: 0,
        calls: 0,
        byProvider: {},
      };
      cur.total += r.total_tokens;
      cur.cost += r.cost_usd;
      cur.calls += r.calls;
      cur.byProvider[r.provider] =
        (cur.byProvider[r.provider] ?? 0) + r.total_tokens;
      map.set(r.date, cur);
    }
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [filteredDaily]);

  const monthlyByMonth = useMemo(() => {
    const map = new Map<
      string,
      { month: string; total: number; cost: number; byProvider: Record<string, number> }
    >();
    for (const r of filteredMonthly) {
      const cur = map.get(r.month) ?? {
        month: r.month,
        total: 0,
        cost: 0,
        byProvider: {},
      };
      cur.total += r.total_tokens;
      cur.cost += r.cost_usd;
      cur.byProvider[r.provider] =
        (cur.byProvider[r.provider] ?? 0) + r.total_tokens;
      map.set(r.month, cur);
    }
    return Array.from(map.values()).sort((a, b) => (a.month < b.month ? 1 : -1));
  }, [filteredMonthly]);

  const totals = useMemo(
    () =>
      filteredDaily.reduce(
        (acc, r) => ({
          tokens: acc.tokens + r.total_tokens,
          cost: acc.cost + r.cost_usd,
          calls: acc.calls + r.calls,
        }),
        { tokens: 0, cost: 0, calls: 0 },
      ),
    [filteredDaily],
  );

  const providerTotals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const r of filteredDaily) {
      t[r.provider] = (t[r.provider] ?? 0) + r.total_tokens;
    }
    return t;
  }, [filteredDaily]);

  const maxDailyTotal = Math.max(1, ...dailyByDate.map((d) => d.total));
  const maxMonthly = Math.max(1, ...monthlyByMonth.map((m) => m.total));

  const toggleProvider = (p: ProviderId) => {
    setEnabledProviders((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const allProvidersOn = enabledProviders.size === PROVIDERS.length;
  const noneSelected = enabledProviders.size === 0;

  return (
    <article className="space-y-10">
      <header className="space-y-2 border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Usage · Token history
          </p>
          {progress.data && (
            <span className="border border-rule bg-paper px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide">
              <span className="text-accent">{progress.data.total_done}</span>
              <span className="text-muted"> / {progress.data.total_nodes} nodes</span>
            </span>
          )}
        </div>
        <h1 className="text-4xl font-semibold leading-tight">
          What you spent <span className="text-accent">in tokens</span>.
        </h1>
        <p className="text-sm text-muted">
          Persisted to Postgres. Filter by time, provider, or pick a single
          date.
        </p>

        {progress.data && progress.data.by_day.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-wide text-muted">
              Learning progress
            </div>
            <div className="flex h-2 overflow-hidden rounded-sm bg-rule">
              <div
                className="h-full bg-accent transition-all"
                style={{
                  width: `${
                    (progress.data.total_done / progress.data.total_nodes) * 100
                  }%`,
                }}
              />
            </div>
            <div className="grid grid-cols-5 gap-1 pt-1 md:grid-cols-10">
              {progress.data.by_day.map((d) => {
                const pct = d.total ? (d.done / d.total) * 100 : 0;
                return (
                  <div
                    key={d.day}
                    title={`Day ${d.day}: ${d.done}/${d.total}`}
                    className="space-y-1"
                  >
                    <div className="flex h-1.5 overflow-hidden rounded-sm bg-rule">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-center font-mono text-[9px] text-muted">
                      D{d.day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {loading && (
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          loading…
        </div>
      )}

      {error && (
        <div className="border-l-2 border-accent bg-paper px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}

      {daily && !daily.available && (
        <div className="border border-rule bg-paper p-4 text-sm text-muted">
          Database is unavailable. History will appear here once Postgres is
          reachable and the <code className="font-mono">token_usage</code> table
          exists.
        </div>
      )}

      {daily?.available && (
        <>
          <section className="space-y-4 border border-rule bg-paper p-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                  Range
                </span>
                <div className="flex flex-wrap gap-1">
                  {RANGES.map((r) => {
                    const active = r.id === rangeId && !pickedDate;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRangeId(r.id);
                          setPickedDate('');
                        }}
                        className={[
                          'border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition',
                          active
                            ? 'border-accent bg-accent text-white'
                            : 'border-rule text-foreground/70 hover:border-foreground hover:text-foreground',
                        ].join(' ')}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                  Pick date
                </span>
                <input
                  type="date"
                  value={pickedDate}
                  max={todayISO()}
                  onChange={(e) => setPickedDate(e.target.value)}
                  className="rounded-none border border-rule bg-background px-2 py-1 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
                />
                {pickedDate && (
                  <button
                    onClick={() => setPickedDate('')}
                    className="font-mono text-[11px] uppercase tracking-wide text-accent hover:underline"
                  >
                    clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                Providers
              </span>
              {PROVIDERS.map((p) => {
                const on = enabledProviders.has(p);
                return (
                  <button
                    key={p}
                    onClick={() => toggleProvider(p)}
                    className={[
                      'flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition',
                      on
                        ? 'border-foreground bg-background text-foreground'
                        : 'border-rule text-muted line-through opacity-60',
                    ].join(' ')}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{
                        background: on ? PROVIDER_COLORS[p] : 'transparent',
                        border: `1px solid ${PROVIDER_COLORS[p]}`,
                      }}
                    />
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setEnabledProviders(new Set(PROVIDERS))}
                disabled={allProvidersOn}
                className="ml-auto font-mono text-[11px] uppercase tracking-wide text-muted hover:text-foreground disabled:opacity-40"
              >
                all
              </button>
            </div>
          </section>

          {noneSelected ? (
            <p className="font-mono text-xs uppercase tracking-wide text-muted">
              No providers selected.
            </p>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Stat
                  label={`${pickedDate || range.label} · tokens`}
                  value={formatNum(totals.tokens)}
                  highlight
                />
                <Stat
                  label={`${pickedDate || range.label} · cost`}
                  value={formatCost(totals.cost)}
                />
                <Stat
                  label={`${pickedDate || range.label} · calls`}
                  value={formatNum(totals.calls)}
                />
              </section>

              {/* Per-provider mini-summary inside the active filter */}
              <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {PROVIDERS.filter((p) => enabledProviders.has(p)).map((p) => {
                  const v = providerTotals[p] ?? 0;
                  const pct = totals.tokens
                    ? (v / totals.tokens) * 100
                    : 0;
                  return (
                    <div
                      key={p}
                      className="border border-rule bg-paper p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-sm"
                          style={{ background: PROVIDER_COLORS[p] }}
                        />
                        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                          {p}
                        </span>
                      </div>
                      <div className="mt-1 font-serif text-xl font-semibold tabular-nums">
                        {formatNum(v)}
                      </div>
                      <div className="font-mono text-[10px] text-muted">
                        {pct.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-semibold">
                  Daily — {pickedDate ? pickedDate : range.label}
                </h2>
                <StackedBarChart
                  data={dailyByDate}
                  enabledProviders={enabledProviders}
                />
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-semibold">Daily list</h2>
                {dailyByDate.length === 0 && (
                  <p className="font-mono text-xs uppercase tracking-wide text-muted">
                    No usage in this window.
                  </p>
                )}
                <ol className="space-y-2">
                  {[...dailyByDate].reverse().map((d) => (
                    <li
                      key={d.date}
                      className="border border-rule bg-paper p-3"
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-mono text-xs text-muted">
                          {d.date}
                        </span>
                        <div className="flex gap-4 font-mono text-xs">
                          <span>{formatNum(d.total)} tok</span>
                          <span className="text-muted">
                            {formatCost(d.cost)}
                          </span>
                        </div>
                      </div>
                      <ProviderBar
                        byProvider={d.byProvider}
                        total={d.total}
                        max={maxDailyTotal}
                      />
                    </li>
                  ))}
                </ol>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-semibold">
                  Monthly — last 12 months
                </h2>
                {monthlyByMonth.length === 0 && (
                  <p className="font-mono text-xs uppercase tracking-wide text-muted">
                    No usage in this window.
                  </p>
                )}
                <ol className="space-y-2">
                  {monthlyByMonth.map((m) => (
                    <li
                      key={m.month}
                      className="border border-rule bg-paper p-3"
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-mono text-xs text-muted">
                          {m.month}
                        </span>
                        <div className="flex gap-4 font-mono text-xs">
                          <span>{formatNum(m.total)} tok</span>
                          <span className="text-muted">
                            {formatCost(m.cost)}
                          </span>
                        </div>
                      </div>
                      <ProviderBar
                        byProvider={m.byProvider}
                        total={m.total}
                        max={maxMonthly}
                      />
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}

          <section className="space-y-2 border-t border-rule pt-6">
            <h2 className="font-serif text-lg font-semibold">Legend</h2>
            <div className="flex flex-wrap gap-4">
              {PROVIDERS.map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ background: PROVIDER_COLORS[p] }}
                  />
                  <span className="font-mono text-xs uppercase tracking-wide text-muted">
                    {p}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </article>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        'border border-rule bg-paper p-4',
        highlight ? 'border-l-2 border-l-accent' : '',
      ].join(' ')}
    >
      <div className="font-mono text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-1 font-serif text-2xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function ProviderBar({
  byProvider,
  total,
  max,
}: {
  byProvider: Record<string, number>;
  total: number;
  max: number;
}) {
  const widthPct = (total / max) * 100;
  return (
    <div className="mt-2">
      <div
        className="flex h-[6px] overflow-hidden rounded-sm bg-rule"
        style={{ width: `${Math.max(2, widthPct)}%` }}
      >
        {Object.entries(byProvider).map(([p, n]) => {
          const segPct = total ? (n / total) * 100 : 0;
          return (
            <div
              key={p}
              title={`${p}: ${n.toLocaleString()} tok`}
              style={{
                width: `${segPct}%`,
                background: PROVIDER_COLORS[p] ?? '#888',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function StackedBarChart({
  data,
  enabledProviders,
}: {
  data: {
    date: string;
    total: number;
    byProvider: Record<string, number>;
  }[];
  enabledProviders: Set<ProviderId>;
}) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const tickValues = [0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  if (data.length === 0) {
    return (
      <div className="border border-rule bg-paper p-6 text-center font-mono text-xs uppercase tracking-wide text-muted">
        No data in this window.
      </div>
    );
  }

  return (
    <div className="border border-rule bg-paper p-4">
      <div className="flex">
        {/* Y axis */}
        <div className="relative mr-2 flex w-12 flex-col-reverse justify-between text-right font-mono text-[10px] text-muted">
          {tickValues.map((v, i) => (
            <span key={i} className="leading-none">
              {v.toLocaleString()}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="relative flex-1">
          {/* Gridlines */}
          <div className="pointer-events-none absolute inset-0 flex flex-col-reverse justify-between">
            {tickValues.map((_, i) => (
              <div key={i} className="h-px w-full bg-rule/60" />
            ))}
          </div>

          {/* Bars */}
          <div className="relative flex h-44 items-stretch gap-[2px]">
            {data.map((d) => {
              const heightPct = (d.total / max) * 100;
              return (
                <div
                  key={d.date}
                  title={`${d.date} — ${d.total.toLocaleString()} tok`}
                  className="group relative flex h-full flex-1 cursor-help flex-col justify-end"
                >
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden"
                    style={{ height: `${heightPct}%`, minHeight: heightPct > 0 ? 2 : 0 }}
                  >
                    {Array.from(enabledProviders).map((p) => {
                      const v = d.byProvider[p] ?? 0;
                      if (v === 0) return null;
                      const segPct = d.total ? (v / d.total) * 100 : 0;
                      return (
                        <div
                          key={p}
                          style={{
                            height: `${segPct}%`,
                            background: PROVIDER_COLORS[p],
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap border border-rule bg-background px-2 py-1 font-mono text-[10px] text-foreground group-hover:block">
                    {d.date} · {d.total.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X axis */}
      <div className="ml-14 mt-2 flex gap-[2px] font-mono text-[9px] text-muted">
        {data.map((d, i) => {
          const showLabel =
            data.length <= 14 ||
            i === 0 ||
            i === data.length - 1 ||
            i % Math.ceil(data.length / 8) === 0;
          return (
            <div
              key={d.date}
              className="flex-1 text-center"
              style={{ minWidth: 0 }}
            >
              {showLabel && (
                <span className="inline-block truncate">
                  {d.date.slice(5)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
