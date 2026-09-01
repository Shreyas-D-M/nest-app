'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listAdminBookings } from '@/lib/api';

export default function BookingsPage(): ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: listAdminBookings,
  });

  const bookings = (data?.items ?? []) as Array<{
    id: string;
    customer?: { name?: string | null };
    professional?: { professional?: { businessName?: string | null } };
    status?: string;
    scheduledStart?: string;
  }>;

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 48px' }}>
      <h1 style={{ marginBottom: 20 }}>Bookings</h1>
      {isLoading && <p>Loading bookings…</p>}
      {error && <p>Unable to load bookings right now.</p>}
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
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Booking</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Customer</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Professional</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>ETA</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && !isLoading && !error ? (
              <tr>
                <td colSpan={5} style={{ padding: '12px 16px' }}>
                  No bookings have been recorded yet.
                </td>
              </tr>
            ) : null}
            {bookings.map((booking) => (
              <tr key={booking.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px' }}>{booking.id}</td>
                <td style={{ padding: '12px 16px' }}>{booking.customer?.name ?? 'Customer'}</td>
                <td style={{ padding: '12px 16px' }}>
                  {booking.professional?.professional?.businessName ?? 'Professional'}
                </td>
                <td style={{ padding: '12px 16px' }}>{booking.status ?? 'UNKNOWN'}</td>
                <td style={{ padding: '12px 16px' }}>
                  {booking.scheduledStart ? new Date(booking.scheduledStart).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
