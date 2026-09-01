import type { ReactElement } from 'react';

export default function OverviewPage(): ReactElement {
  return (
    <main
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '32px 24px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            Operations
          </p>
          <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700 }}>Overview</h1>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        {[
          { label: 'Pending verifications', value: '24' },
          { label: 'Jobs today', value: '128' },
          { label: 'Payouts due', value: '₹1.8L' },
          { label: 'Open disputes', value: '07' },
        ].map((card) => (
          <article
            key={card.label}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
            }}
          >
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{card.label}</p>
            <h2 style={{ margin: '12px 0 0', fontSize: 28, fontWeight: 700 }}>{card.value}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
