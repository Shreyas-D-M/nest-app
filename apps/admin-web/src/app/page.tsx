'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { createTranslator } from '@nest/i18n';
import { getAdminStats, listAdminProfessionals } from '@/lib/api';

const t = createTranslator('en');

export default function HomePage(): ReactElement {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  });
  const { data: professionals, isLoading: prosLoading, error: prosError } = useQuery({
    queryKey: ['admin-professionals'],
    queryFn: listAdminProfessionals,
  });

  const summaryCards = [
    {
      label: t('admin.dashboard.pendingVerifications'),
      value: String(stats?.users.professionalsByStatus?.PENDING_REVIEW ?? 0),
      tone: 'neutral',
    },
    {
      label: t('admin.dashboard.jobsToday'),
      value: String(stats?.bookings.total ?? 0),
      tone: 'success',
    },
    {
      label: t('admin.dashboard.payouts'),
      value: `₹${((stats?.payments.totalRevenueMinor ?? 0) / 100).toLocaleString('en-IN')}`,
      tone: 'accent',
    },
    {
      label: t('admin.dashboard.refunds'),
      value: String(stats?.payments.failed ?? 0),
      tone: 'warning',
    },
  ];

  const verificationQueue = (professionals?.items ?? []).slice(0, 3).map((person) => ({
    name: person.businessName,
    service: 'Service profile',
    status: person.verificationStatus,
    risk: person.onlineStatus === 'ONLINE' ? 'Low' : 'Medium',
  }));

  const liveBookings = stats?.bookings.byStatus
    ? Object.entries(stats.bookings.byStatus).map(([status, count]) => ({
        customer: 'Live data',
        professional: `${count} booking${count === 1 ? '' : 's'}`,
        status,
        eta: '—',
      }))
    : [];

  const supportQueue = stats?.support
    ? [{
        ticket: 'Support queue',
        customer: `${stats.support.openTickets} open`,
        issue: 'Customer support backlog',
        priority: 'Live',
      }]
    : [];
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
            {t('admin.dashboard.title')}
          </p>
          <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700 }}>Overview</h1>
        </div>
        <button
          type="button"
          style={{
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('admin.dashboard.viewAll')}
        </button>
      </header>

      {(statsLoading || prosLoading) && <p>Loading admin overview…</p>}
      {(statsError || prosError) && <p>Unable to load admin overview right now.</p>}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        {summaryCards.map((card) => (
          <article
            key={card.label}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              minHeight: 120,
            }}
          >
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{card.label}</p>
            <h2 style={{ margin: '12px 0 0', fontSize: 28, fontWeight: 700 }}>{card.value}</h2>
          </article>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        <article
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18 }}>{t('admin.dashboard.verificationQueue')}</h3>
            <span style={{ color: 'var(--color-accent)', fontSize: 13 }}>
              {t('admin.dashboard.viewAll')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {verificationQueue.length === 0 && (
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                No professionals are currently waiting for review.
              </p>
            )}
            {verificationQueue.map((item) => (
              <div
                key={item.name}
                style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <strong>{item.name}</strong>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {item.risk}
                  </span>
                </div>
                <p style={{ margin: '4px 0 8px', color: 'var(--color-text-secondary)' }}>
                  {item.service}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {item.status}
                  </span>
                  <button
                    type="button"
                    style={{
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-background)',
                      borderRadius: '999px',
                      padding: '7px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {t('admin.dashboard.approve')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18 }}>{t('admin.dashboard.liveBookings')}</h3>
            <span style={{ color: 'var(--color-accent)', fontSize: 13 }}>
              {t('admin.dashboard.viewAll')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {liveBookings.map((booking) => (
              <div
                key={`${booking.customer}-${booking.professional}`}
                style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <strong>{booking.customer}</strong>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {booking.status}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>
                  {booking.professional}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {booking.eta}
                  </span>
                  <button
                    type="button"
                    style={{
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-background)',
                      borderRadius: '999px',
                      padding: '7px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {t('admin.dashboard.review')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>{t('admin.dashboard.supportQueue')}</h3>
          <span style={{ color: 'var(--color-accent)', fontSize: 13 }}>
            {t('admin.dashboard.viewAll')}
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: 12 }}>
              <th style={{ padding: '8px 0' }}>Ticket</th>
              <th style={{ padding: '8px 0' }}>Customer</th>
              <th style={{ padding: '8px 0' }}>Issue</th>
              <th style={{ padding: '8px 0' }}>{t('admin.dashboard.priority')}</th>
            </tr>
          </thead>
          <tbody>
            {supportQueue.map((item) => (
              <tr key={item.ticket} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 0' }}>{item.ticket}</td>
                <td style={{ padding: '12px 0' }}>{item.customer}</td>
                <td style={{ padding: '12px 0' }}>{item.issue}</td>
                <td style={{ padding: '12px 0' }}>{item.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
