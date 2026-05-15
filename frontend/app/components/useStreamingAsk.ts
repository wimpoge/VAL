'use client';

import { useCallback, useRef, useState } from 'react';

export type StreamMeta = {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
};

export type FlowDiagramData = {
  title: string;
  steps: { id: number; label: string; sublabel?: string }[];
  connections: [number, number][];
};

export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

type StartArgs = {
  url: string;
  body: unknown;
};

export function useStreamingAsk() {
  const [thinking, setThinking] = useState('');
  const [answer, setAnswer] = useState('');
  const [meta, setMeta] = useState<StreamMeta | null>(null);
  const [diagram, setDiagram] = useState<FlowDiagramData | null>(null);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setThinking('');
    setAnswer('');
    setMeta(null);
    setDiagram(null);
    setError(null);
    setStatus('idle');
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const start = useCallback(async ({ url, body }: StartArgs) => {
    stop();
    setThinking('');
    setAnswer('');
    setMeta(null);
    setDiagram(null);
    setError(null);
    setStatus('streaming');

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!r.ok || !r.body) {
        const text = await r.text().catch(() => '');
        throw new Error(text || `HTTP ${r.status}`);
      }

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const evt = parseSSE(raw);
          if (!evt) continue;
          handleEvent(evt);
        }
      }
      if (buffer.trim()) {
        const evt = parseSSE(buffer);
        if (evt) handleEvent(evt);
      }

      setStatus((s) => (s === 'streaming' ? 'done' : s));
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    } finally {
      abortRef.current = null;
    }

    function handleEvent(evt: { event: string; data: string }) {
      let data: unknown = null;
      try {
        data = JSON.parse(evt.data);
      } catch {
        return;
      }
      if (evt.event === 'thinking') {
        const delta = (data as { delta?: string })?.delta ?? '';
        setThinking((t) => t + delta);
      } else if (evt.event === 'answer') {
        const delta = (data as { delta?: string })?.delta ?? '';
        setAnswer((a) => a + delta);
      } else if (evt.event === 'diagram') {
        const d = (data as { diagram?: FlowDiagramData | null })?.diagram;
        setDiagram(d ?? null);
      } else if (evt.event === 'done') {
        const d = data as {
          provider: string;
          model: string;
          prompt_tokens: number;
          completion_tokens: number;
        };
        setMeta({
          provider: d.provider,
          model: d.model,
          promptTokens: d.prompt_tokens,
          completionTokens: d.completion_tokens,
        });
        setStatus('done');
      } else if (evt.event === 'error') {
        const detail = (data as { detail?: string })?.detail ?? 'stream error';
        setError(detail);
        setStatus('error');
      }
    }
  }, [stop]);

  return {
    start,
    stop,
    reset,
    thinking,
    answer,
    meta,
    diagram,
    status,
    error,
  };
}

export function parseSSE(raw: string): { event: string; data: string } | null {
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of raw.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    const idx = line.indexOf(':');
    const field = idx === -1 ? line : line.slice(0, idx);
    let value = idx === -1 ? '' : line.slice(idx + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') event = value;
    else if (field === 'data') dataLines.push(value);
  }
  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}
