'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listAdminAuditLogs } from '@/lib/api';

export default function AuditPage(): ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: listAdminAuditLogs,
  });

  const auditRows = (data?.items ?? []) as Array<{
    action?: string;
    actorId?: string;
    entityType?: string;
    entityId?: string;
    createdAt?: string;
  }>;

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 48px' }}>
      <h1 style={{ marginBottom: 20 }}>Audit log</h1>
      {isLoading && <p>Loading audit log…</p>}
      {error && <p>Unable to load the audit log right now.</p>}
      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: 'var(--color-background)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Action</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Actor</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Entity</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {auditRows.length === 0 && !isLoading && !error ? (
              <tr>
                <td colSpan={4} style={{ padding: '12px 16px' }}>
                  No audit events have been recorded yet.
                </td>
              </tr>
            ) : null}
            {auditRows.map((row, index) => (
              <tr
                key={`${row.action ?? 'action'}-${row.entityId ?? index}`}
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                <td style={{ padding: '12px 16px' }}>{row.action ?? 'ACTION'}</td>
                <td style={{ padding: '12px 16px' }}>{row.actorId ?? 'SYSTEM'}</td>
                <td style={{ padding: '12px 16px' }}>{row.entityType ?? 'UNKNOWN'}</td>
                <td style={{ padding: '12px 16px' }}>
                  {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
