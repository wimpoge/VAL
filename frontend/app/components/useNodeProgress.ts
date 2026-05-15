'use client';

import { useCallback, useEffect, useState } from 'react';

export type ProgressNode = {
  node_id: string;
  day: number;
  label: string;
  completed: boolean;
  completed_at: string | null;
};

export type ProgressByDay = { day: number; done: number; total: number };

export type ProgressResponse = {
  nodes: ProgressNode[];
  by_day: ProgressByDay[];
  total_done: number;
  total_nodes: number;
  available: boolean;
};

const API = 'http://localhost:8000';

export function useNodeProgress(day?: number) {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const r = await fetch(`${API}/progress`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = (await r.json()) as ProgressResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const toggle = useCallback(
    async (nodeId: string, completed?: boolean) => {
      setToggling(nodeId);
      try {
        const r = await fetch(`${API}/progress/${nodeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            completed === undefined ? {} : { completed },
          ),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        await refetch();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('progress:changed'));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setToggling(null);
      }
    },
    [refetch],
  );

  const dayNodes = data?.nodes.filter((n) => (day ? n.day === day : true)) ?? [];
  const dayProgress = day
    ? data?.by_day.find((b) => b.day === day) ?? null
    : null;

  const completedSet = new Set(
    dayNodes.filter((n) => n.completed).map((n) => n.node_id),
  );

  return {
    data,
    nodes: dayNodes,
    completedSet,
    dayProgress,
    error,
    loading,
    toggling,
    toggle,
    refetch,
  };
}
