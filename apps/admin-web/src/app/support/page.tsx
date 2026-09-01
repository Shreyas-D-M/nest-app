'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listAdminSupportTickets } from '@/lib/api';

export default function SupportPage(): ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: listAdminSupportTickets,
  });

  const tickets = (data?.data ?? []) as Array<{
    id: string;
    customer?: { name?: string | null };
    subject?: string;
    priority?: string;
  }>;

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 48px' }}>
      <h1 style={{ marginBottom: 20 }}>Support queue</h1>
      {isLoading && <p>Loading support queue…</p>}
      {error && <p>Unable to load the support queue right now.</p>}
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
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Ticket</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Customer</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Issue</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && !isLoading && !error ? (
              <tr>
                <td colSpan={4} style={{ padding: '12px 16px' }}>
                  No support tickets are currently open.
                </td>
              </tr>
            ) : null}
            {tickets.map((ticket) => (
              <tr key={ticket.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px' }}>{ticket.id}</td>
                <td style={{ padding: '12px 16px' }}>{ticket.customer?.name ?? 'Customer'}</td>
                <td style={{ padding: '12px 16px' }}>{ticket.subject ?? 'Support request'}</td>
                <td style={{ padding: '12px 16px' }}>{ticket.priority ?? 'MEDIUM'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
