'use client';

import { useEffect, useState } from 'react';

type ProvidersResponse = {
  providers: string[];
  default: string;
  models: Record<string, string>;
};

type Props = {
  selected: string;
  onChange: (p: string) => void;
  disabled?: boolean;
};

export default function ModelSwitcher({ selected, onChange, disabled }: Props) {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ProvidersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    fetch('http://localhost:8000/providers')
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      })
      .then((json: ProvidersResponse) => {
        if (cancelled) return;
        setData(json);
        if (!selected && json.default) onChange(json.default);
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [mounted, onChange, selected]);

  const baseClass =
    'rounded-none border border-rule bg-paper px-2.5 py-1 font-mono text-xs uppercase tracking-wide focus:border-accent focus:outline-none';

  if (!mounted) {
    return (
      <span
        className={`${baseClass} inline-block min-w-[14ch] text-muted opacity-50`}
        aria-hidden
      >
        loading…
      </span>
    );
  }

  if (error) {
    return <span className="text-xs text-accent">providers offline</span>;
  }

  if (!data) {
    return (
      <span
        className={`${baseClass} inline-block min-w-[14ch] text-muted opacity-50`}
      >
        loading…
      </span>
    );
  }

  return (
    <select
      value={selected || data.default}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled === true}
      aria-label="AI provider and model"
      className={`${baseClass} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {data.providers.map((p) => (
        <option key={p} value={p}>
          {p} · {data.models[p]}
        </option>
      ))}
    </select>
  );
}
