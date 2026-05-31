'use client';

import dynamic from 'next/dynamic';
import type { FlowDiagramData } from './FlowDiagram';

// FlowDiagram is a 200+-line SVG-animation component that only renders
// when a streaming answer ships a `diagram` payload (Day 01 mainly). Most
// pages that import Markdown never render one. next/dynamic with ssr:false
// keeps it out of the initial bundle and out of SSR until first use.
const FlowDiagram = dynamic(() => import('./FlowDiagram'), {
  loading: () => null,
  ssr: false,
});

type Block =
  | { kind: 'p' | 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'table'; header: string[] | null; rows: string[][] };

type InlinePart = { kind: 'text' | 'bold' | 'italic' | 'code'; text: string };

export function AnswerCard({
  text,
  streaming,
  placeholder,
  diagram,
}: {
  text: string;
  streaming?: boolean;
  placeholder?: string;
  diagram?: FlowDiagramData | null;
}) {
  return (
    <div className="border border-rule border-l-2 border-l-accent bg-paper p-5">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
        <span>answer</span>
        {streaming && (
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        )}
      </div>
      <div className="text-[15px] leading-relaxed text-foreground">
        {text ? (
          <Markdown text={text} streaming={streaming} />
        ) : (
          <span className="text-muted/60">{placeholder}</span>
        )}
      </div>
      {diagram && <FlowDiagram diagram={diagram} />}
    </div>
  );
}

export function Markdown({
  text,
  streaming,
}: {
  text: string;
  streaming?: boolean;
}) {
  const blocks = parseBlocks(text);
  return (
    <>
      {blocks.map((b, i) => {
        const isLast = i === blocks.length - 1;
        const caret = streaming && isLast;
        if (b.kind === 'h1')
          return (
            <h3 key={i} className="mt-3 mb-2 font-serif text-xl font-semibold">
              <Inline text={b.text} caret={caret} />
            </h3>
          );
        if (b.kind === 'h2')
          return (
            <h4 key={i} className="mt-3 mb-2 font-serif text-lg font-semibold">
              <Inline text={b.text} caret={caret} />
            </h4>
          );
        if (b.kind === 'h3')
          return (
            <h5
              key={i}
              className="mt-3 mb-1.5 font-mono text-xs uppercase tracking-wide text-muted"
            >
              <Inline text={b.text} caret={caret} />
            </h5>
          );
        if (b.kind === 'ul')
          return (
            <ul
              key={i}
              className="my-2 ml-4 list-disc space-y-1 marker:text-accent"
            >
              {b.items.map((it, j) => (
                <li key={j}>
                  <Inline
                    text={it}
                    caret={caret && j === b.items.length - 1}
                  />
                </li>
              ))}
            </ul>
          );
        if (b.kind === 'table')
          return (
            <div
              key={i}
              className="my-3 overflow-x-auto border border-rule"
            >
              <table className="w-full border-collapse text-[14px]">
                {b.header && (
                  <thead className="bg-paper">
                    <tr>
                      {b.header.map((h, j) => (
                        <th
                          key={j}
                          className="border-b border-rule px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wide text-muted"
                        >
                          <Inline text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {b.rows.map((row, r) => (
                    <tr
                      key={r}
                      className="border-t border-rule first:border-t-0"
                    >
                      {row.map((cell, c) => (
                        <td key={c} className="px-3 py-2 align-top">
                          <Inline
                            text={cell}
                            caret={
                              caret &&
                              r === b.rows.length - 1 &&
                              c === row.length - 1
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        return (
          <p key={i} className="my-2 whitespace-pre-wrap">
            <Inline text={b.text} caret={caret} />
          </p>
        );
      })}
    </>
  );
}

function Inline({ text, caret }: { text: string; caret?: boolean }) {
  const parts = parseInline(text);
  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === 'bold')
          return (
            <strong key={i} className="font-semibold text-foreground">
              {p.text}
            </strong>
          );
        if (p.kind === 'italic')
          return (
            <em key={i} className="italic">
              {p.text}
            </em>
          );
        if (p.kind === 'code')
          return (
            <code
              key={i}
              className="rounded border border-rule bg-paper px-1 py-0.5 font-mono text-[0.85em]"
            >
              {p.text}
            </code>
          );
        return <span key={i}>{p.text}</span>;
      })}
      {caret && (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-accent" />
      )}
    </>
  );
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

function isSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function parseBlocks(src: string): Block[] {
  const lines = src.split('\n');
  const out: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;

  const flushPara = () => {
    if (para.length) {
      out.push({ kind: 'p', text: para.join('\n') });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push({ kind: 'ul', items: list });
      list = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    if (line.includes('|') && isSeparator(lines[i + 1] ?? '')) {
      flushPara();
      flushList();
      const header = splitRow(line);
      i += 1;
      const rows: string[][] = [];
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        if (!next.trim() || !next.includes('|')) break;
        rows.push(splitRow(next));
        i += 1;
      }
      out.push({ kind: 'table', header, rows });
      continue;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      (list ??= []).push(bullet[1]);
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      out.push({
        kind: (level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3') as Block['kind'],
        text: heading[2],
      } as Block);
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return out;
}

function parseInline(src: string): InlinePart[] {
  const out: InlinePart[] = [];
  let i = 0;
  let buf = '';
  const flush = () => {
    if (buf) {
      out.push({ kind: 'text', text: buf });
      buf = '';
    }
  };
  while (i < src.length) {
    if (src[i] === '`') {
      const end = src.indexOf('`', i + 1);
      if (end !== -1) {
        flush();
        out.push({ kind: 'code', text: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (src[i] === '*' && src[i + 1] === '*') {
      const end = src.indexOf('**', i + 2);
      if (end !== -1) {
        flush();
        out.push({ kind: 'bold', text: src.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    if (src[i] === '*') {
      const end = src.indexOf('*', i + 1);
      if (end !== -1 && src[end + 1] !== '*' && src[i - 1] !== '*') {
        flush();
        out.push({ kind: 'italic', text: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    buf += src[i];
    i++;
  }
  flush();
  return out;
}
