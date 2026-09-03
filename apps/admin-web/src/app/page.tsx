'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { getAdminStats, listAdminBookings, listAdminProfessionals } from '@/lib/api';
import {
  BookingsIcon,
  EmptyState,
  KpiCard,
  LoadingSkeleton,
  PaymentsIcon,
  ProfessionalsIcon,
  StatusBadge,
  SupportIcon,
} from '@/components';

export default function OverviewPage(): ReactElement {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  });

  const { data: prosData, isLoading: prosLoading } = useQuery({
    queryKey: ['admin-professionals'],
    queryFn: () => listAdminProfessionals(),
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => listAdminBookings(),
  });

  const pendingPros = (prosData?.items ?? []).filter(
    (p) => p.verificationStatus === 'PENDING_REVIEW',
  );
  const recentBookings = (bookingsData?.items ?? []).slice(0, 5);

  const totalRevenueMinor = stats?.payments.totalRevenueMinor ?? 0;
  const formattedRevenue = `₹${(totalRevenueMinor / 100).toLocaleString('en-IN')}`;

  return (
    <div>
      {/* Top Page Context Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
            OPERATIONS DESK
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: 'var(--color-text-main)' }}>
            System Overview & Operational Queues
          </h1>
        </div>
        <Link href="/bookings" className="btn btn-primary">
          Dispatch Console →
        </Link>
      </div>

      {/* KPI Cards Grid */}
      {statsLoading ? (
        <LoadingSkeleton rows={1} height={120} />
      ) : (
        <div className="stat-card-grid">
          <KpiCard
            label="Total Bookings"
            value={stats?.bookings.total ?? 0}
            subtitle={`${stats?.bookings.completed ?? 0} completed services`}
            icon={<BookingsIcon />}
          />
          <KpiCard
            label="Pending Verifications"
            value={pendingPros.length}
            subtitle="Requires KYC audit"
            badge={pendingPros.length > 0 ? 'Action Needed' : 'All Clear'}
            badgeType={pendingPros.length > 0 ? 'warning' : 'success'}
            icon={<ProfessionalsIcon />}
          />
          <KpiCard
            label="Platform GMV"
            value={formattedRevenue}
            subtitle="Processed transaction volume"
            icon={<PaymentsIcon />}
          />
          <KpiCard
            label="Open Support Tickets"
            value={stats?.support.openTickets ?? 0}
            subtitle="Customer helpline backlog"
            badge={stats?.support.openTickets ? 'Pending' : 'Resolved'}
            badgeType={stats?.support.openTickets ? 'danger' : 'success'}
            icon={<SupportIcon />}
          />
        </div>
      )}

      {/* Operational Queues Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24 }}>
        {/* Pending Professional Verification Queue */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-main)' }}>
              Pending Professional Verifications ({pendingPros.length})
            </h2>
            <Link href="/professionals" style={{ fontSize: 12, fontWeight: 700 }}>
              Audit Queue →
            </Link>
          </div>

          {prosLoading ? (
            <LoadingSkeleton rows={3} height={54} />
          ) : pendingPros.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingPros.map((pro) => (
                <div
                  key={pro.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{pro.businessName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {pro.documentCount} verification document{pro.documentCount === 1 ? '' : 's'} uploaded
                    </div>
                  </div>
                  <Link
                    href="/professionals"
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                  >
                    Inspect KYC
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Verification Queue Clear"
              description="All professional partner KYC documents have been reviewed and resolved."
              icon={<ProfessionalsIcon />}
            />
          )}
        </div>

        {/* Live Recent Bookings Feed */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-main)' }}>
              Recent Booking Activity
            </h2>
            <Link href="/bookings" style={{ fontSize: 12, fontWeight: 700 }}>
              View All Bookings →
            </Link>
          </div>

          {bookingsLoading ? (
            <LoadingSkeleton rows={3} height={54} />
          ) : recentBookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                      {b.service?.name ?? 'Service Booking'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {b.customer?.name ?? 'Customer'} · {b.address?.locality ?? 'Belagavi'}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Recent Bookings"
              description="Live doorstep bookings created by customers will appear here."
              icon={<BookingsIcon />}
            />
          )}
        </div>
      </div>
    </div>
  );
}
