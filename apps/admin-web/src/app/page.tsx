import type { ReactElement } from 'react';
import { createTranslator } from '@nest/i18n';
import { API_PREFIX } from '@nest/types';

const t = createTranslator('en');

/** Falls back to the local API so the shell renders without configuration. */
const apiBaseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000';

/**
 * Phase 0 shell.
 *
 * No admin functionality is implemented. Overview, verification queue, bookings,
 * payments, disputes and audit logs each arrive with their own phase — an empty
 * navigation frame pointing at unbuilt screens would suggest capability that
 * does not exist.
 */
export default function HomePage(): ReactElement {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'var(--space-xxl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}
      >
        {t('app.name')} Admin
      </p>

      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>{t('foundation.heading')}</h1>

      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{t('foundation.body')}</p>

      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)',
          padding: 'var(--space-md)',
        }}
      >
        <code style={{ fontSize: 13 }}>
          {t('foundation.apiTarget', { url: `${apiBaseUrl}${API_PREFIX}` })}
        </code>
      </div>
    </main>
  );
}
