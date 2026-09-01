'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listAdminPayments } from '@/lib/api';

export default function PaymentsPage(): ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: listAdminPayments,
  });

  const payments = (data?.items ?? []) as Array<{
    id: string;
    booking?: { customer?: { name?: string | null } };
    amountMinor?: number;
    status?: string;
  }>;

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 48px' }}>
      <h1 style={{ marginBottom: 20 }}>Payments & refunds</h1>
      {isLoading && <p>Loading payments…</p>}
      {error && <p>Unable to load payments right now.</p>}
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
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Customer</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Amount</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && !isLoading && !error ? (
              <tr>
                <td colSpan={4} style={{ padding: '12px 16px' }}>
                  No payments have been processed yet.
                </td>
              </tr>
            ) : null}
            {payments.map((payment) => (
              <tr key={payment.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px' }}>{payment.id}</td>
                <td style={{ padding: '12px 16px' }}>{payment.booking?.customer?.name ?? 'Customer'}</td>
                <td style={{ padding: '12px 16px' }}>
                  {payment.amountMinor != null ? `₹${(payment.amountMinor / 100).toFixed(0)}` : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>{payment.status ?? 'UNKNOWN'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
