const ACCENT = '#f97316';
const MUTED = '#a8a29e';
const RULE = '#292524';

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        gap: '1.25rem',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: MUTED,
        }}
      >
        VAL · Practice
      </span>

      <h1
        style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          lineHeight: 1.1,
          margin: 0,
          maxWidth: '32ch',
          fontWeight: 600,
        }}
      >
        Day 11&ndash;20 experiments are{' '}
        <span style={{ color: ACCENT }}>coming soon</span>.
      </h1>

      <p
        style={{
          maxWidth: '50ch',
          color: MUTED,
          fontSize: '0.95rem',
          lineHeight: 1.6,
        }}
      >
        This is the hands-on practice app for the advanced roadmap (port 3001).
        It&rsquo;s only a placeholder right now &mdash; the real Day 11&ndash;20
        pages get scaffolded by the Step 0 prompt in{' '}
        <code style={{ color: ACCENT }}>AI_ENGINEER_ROADMAP_ADVANCED.md</code>.
      </p>

      <div
        style={{
          marginTop: '0.75rem',
          padding: '1rem 1.25rem',
          border: `1px solid ${RULE}`,
          borderLeft: `2px solid ${ACCENT}`,
          maxWidth: '52ch',
          textAlign: 'left',
          fontSize: '0.85rem',
          lineHeight: 1.65,
        }}
      >
        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: MUTED,
            marginBottom: '0.4rem',
          }}
        >
          Next step
        </div>
        Open <code style={{ color: ACCENT }}>AI_ENGINEER_ROADMAP_ADVANCED.md</code>{' '}
        and feed the &ldquo;Setup prompt&rdquo; block (Step 0) to Claude Code.
        That scaffolds the Day 11&ndash;20 pages and per-day backends.
      </div>

      <a
        href="http://localhost:3000"
        style={{
          marginTop: '0.5rem',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          fontSize: '0.75rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: MUTED,
          textDecoration: 'none',
          borderBottom: `1px dashed ${MUTED}`,
          paddingBottom: '0.1rem',
        }}
      >
        &larr; Back to VAL (Day 1&ndash;10)
      </a>
    </main>
  );
}
