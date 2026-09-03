'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listAdminSupportTickets } from '@/lib/api';
import { EmptyState, LoadingSkeleton, StatusBadge, SupportIcon } from '@/components';

export default function SupportQueuePage(): ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: listAdminSupportTickets,
  });

  const tickets = data?.data ?? [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
          CUSTOMER SUCCESS & RESOLUTION
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: 'var(--color-text-main)' }}>
          Support Operations Queue
        </h1>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} height={52} />
      ) : error ? (
        <div style={{ color: 'var(--color-danger)', padding: 16 }}>
          Error loading support queue.
        </div>
      ) : (
        /* Table */
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Category</th>
                <th>Customer</th>
                <th>Subject & Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <EmptyState
                      title="Support Queue Clear"
                      description="No open unresolved customer support tickets."
                      icon={<SupportIcon />}
                    />
                  </td>
                </tr>
              ) : null}

              {tickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{t.id.slice(0, 8)}</td>
                  <td>
                    <StatusBadge status={t.category} type="primary" />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.customer?.name ?? 'Customer'}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{t.customer?.phone}</div>
                  </td>
                  <td style={{ maxWidth: 360 }}>
                    <div style={{ fontWeight: 600 }}>{t.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{t.description}</div>
                  </td>
                  <td>
                    <StatusBadge status={t.priority} />
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td style={{ fontSize: 12 }}>{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
