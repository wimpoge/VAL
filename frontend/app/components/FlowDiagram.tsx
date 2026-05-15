'use client';

import { useEffect, useState } from 'react';

export type FlowDiagramData = {
  title: string;
  steps: { id: number; label: string; sublabel?: string }[];
  connections: [number, number][];
};

const PALETTE = [
  { fill: '#fee2e2', stroke: '#fca5a5', text: '#7f1d1d' },
  { fill: '#dbeafe', stroke: '#93c5fd', text: '#1e3a8a' },
  { fill: '#d1fae5', stroke: '#6ee7b7', text: '#064e3b' },
  { fill: '#fef3c7', stroke: '#fcd34d', text: '#78350f' },
  { fill: '#ede9fe', stroke: '#c4b5fd', text: '#4c1d95' },
];

const BOX_W = 140;
const BOX_H = 64;
const GAP_X = 32;
const GAP_Y = 28;
const ARROW = 14;
const PER_ROW = 4;
const REVEAL_MS = 120;

export default function FlowDiagram({
  diagram,
}: {
  diagram: FlowDiagramData;
}) {
  const steps = diagram.steps;
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    if (!steps.length) return;
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setRevealed(i);
      if (i < steps.length) {
        setTimeout(tick, REVEAL_MS);
      }
    };
    const id = setTimeout(tick, 80);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [steps]);

  if (!steps.length) return null;

  const rows = Math.ceil(steps.length / PER_ROW);
  const cols = Math.min(steps.length, PER_ROW);

  const width = cols * BOX_W + (cols - 1) * GAP_X;
  const height = rows * BOX_H + (rows - 1) * GAP_Y;

  const positions = new Map<
    number,
    { x: number; y: number; row: number; col: number; index: number }
  >();
  steps.forEach((s, idx) => {
    const row = Math.floor(idx / PER_ROW);
    const col = idx % PER_ROW;
    positions.set(s.id, {
      x: col * (BOX_W + GAP_X),
      y: row * (BOX_H + GAP_Y),
      row,
      col,
      index: idx,
    });
  });

  return (
    <figure className="my-4 border border-rule bg-paper p-4">
      <figcaption className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {diagram.title}
      </figcaption>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ color: 'currentColor', maxWidth: width, display: 'block' }}
        >
          <defs>
            <marker
              id="flowarrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
            </marker>
          </defs>

          {diagram.connections.map(([a, b], i) => {
            const pa = positions.get(a);
            const pb = positions.get(b);
            if (!pa || !pb) return null;
            const visible = revealed > Math.max(pa.index, pb.index);
            return (
              <g
                key={`c${i}-${a}-${b}`}
                style={{
                  opacity: visible ? 1 : 0,
                  transition: 'opacity 200ms ease-out',
                }}
              >
                <ConnectorPath from={pa} to={pb} />
              </g>
            );
          })}

          {steps.map((s, idx) => {
            const pos = positions.get(s.id);
            if (!pos) return null;
            const c = PALETTE[idx % PALETTE.length];
            const visible = idx < revealed;
            return (
              <g key={s.id} transform={`translate(${pos.x}, ${pos.y})`}>
                <g
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible
                      ? 'translateX(0px)'
                      : 'translateX(-8px)',
                    transition:
                      'opacity 200ms ease-out, transform 200ms ease-out',
                  }}
                >
                  <rect
                    width={BOX_W}
                    height={BOX_H}
                    rx={10}
                    ry={10}
                    fill={c.fill}
                    stroke={c.stroke}
                    strokeWidth={1}
                  />
                  <text
                    x={BOX_W / 2}
                    y={s.sublabel ? BOX_H / 2 - 4 : BOX_H / 2 + 4}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={600}
                    fill={c.text}
                  >
                    {truncate(s.label, 22)}
                  </text>
                  {s.sublabel && (
                    <text
                      x={BOX_W / 2}
                      y={BOX_H / 2 + 13}
                      textAnchor="middle"
                      fontSize={11}
                      fill={c.text}
                      opacity={0.7}
                    >
                      {truncate(s.sublabel, 28)}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}

function ConnectorPath({
  from,
  to,
}: {
  from: { x: number; y: number; row: number; col: number };
  to: { x: number; y: number; row: number; col: number };
}) {
  if (from.row === to.row) {
    const x1 = from.x + BOX_W;
    const y1 = from.y + BOX_H / 2;
    const x2 = to.x - ARROW / 2;
    const y2 = to.y + BOX_H / 2;
    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#9ca3af"
        strokeWidth={1.5}
        markerEnd="url(#flowarrow)"
        fill="none"
      />
    );
  }
  const x1 = from.x + BOX_W / 2;
  const y1 = from.y + BOX_H;
  const midY = from.y + BOX_H + GAP_Y / 2;
  const x2 = to.x + BOX_W / 2;
  const y2 = to.y - ARROW / 2;
  const d = `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}`;
  return (
    <path
      d={d}
      stroke="#9ca3af"
      strokeWidth={1.5}
      fill="none"
      markerEnd="url(#flowarrow)"
    />
  );
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
