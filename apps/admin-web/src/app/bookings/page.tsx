'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { cancelAdminBooking, listAdminBookings, type AdminBookingItem } from '@/lib/api';
import {
  BookingsIcon,
  ConfirmationModal,
  EmptyState,
  LoadingSkeleton,
  SearchIcon,
  StatusBadge,
} from '@/components';

const STATUS_FILTERS = [
  'ALL',
  'REQUESTED',
  'ACCEPTED',
  'ARRIVING',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_PROFESSIONAL',
  'CANCELLED_BY_ADMIN',
];

export default function BookingsPage(): ReactElement {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalBooking, setCancelModalBooking] = useState<AdminBookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-bookings', selectedStatus],
    queryFn: () =>
      listAdminBookings(selectedStatus === 'ALL' ? undefined : selectedStatus),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelAdminBooking(cancelModalBooking!.id, cancelReason.trim()),
    onSuccess: () => {
      setCancelModalBooking(null);
      setCancelReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      alert('Booking cancelled successfully.');
    },
    onError: (err: Error) => {
      alert(`Failed to cancel booking: ${err.message}`);
    },
  });

  const bookings = data?.items ?? [];

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      (b.customer?.name ?? '').toLowerCase().includes(q) ||
      (b.customer?.phone ?? '').includes(q) ||
      (b.professional?.professional?.businessName ?? '').toLowerCase().includes(q) ||
      (b.service?.name ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
          SERVICE DISPATCH & TRACKING
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: 'var(--color-text-main)' }}>
          Bookings Management
        </h1>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar-container">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              className={`btn ${selectedStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => setSelectedStatus(st)}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <SearchIcon style={{ position: 'absolute', left: 10, color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search by ID, customer, pro…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} height={52} />
      ) : error ? (
        <div style={{ color: 'var(--color-danger)', padding: 16 }}>
          Error loading bookings queue.
        </div>
      ) : (
        /* Data Table */
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Service</th>
                <th>Customer</th>
                <th>Specialist</th>
                <th>Address / Area</th>
                <th>Scheduled Time</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 0 }}>
                    <EmptyState
                      title="No Bookings Found"
                      description="No bookings match the selected status filter or search criteria."
                      icon={<BookingsIcon />}
                    />
                  </td>
                </tr>
              ) : null}

              {filteredBookings.map((b) => {
                const amount = b.finalAmountMinor ?? b.estimatedAmountMinor;
                const isCancellable =
                  !b.status.startsWith('CANCELLED') && b.status !== 'COMPLETED';

                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{b.id.slice(0, 8)}</td>
                    <td style={{ fontWeight: 600 }}>{b.service?.name ?? 'Home Service'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.customer?.name ?? 'Customer'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{b.customer?.phone}</div>
                    </td>
                    <td>{b.professional?.professional?.businessName ?? 'Unassigned'}</td>
                    <td>{b.address?.locality ?? b.address?.city ?? 'Belagavi'}</td>
                    <td style={{ fontSize: 12 }}>
                      {b.scheduledStart ? new Date(b.scheduledStart).toLocaleString() : '—'}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{(amount / 100).toFixed(0)}</td>
                    <td>
                      {isCancellable ? (
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => {
                            setCancelModalBooking(b);
                            setCancelReason('');
                          }}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Booking Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(cancelModalBooking)}
        title={`Cancel Booking (${cancelModalBooking?.id.slice(0, 8)})`}
        description="Are you sure you want to cancel this booking as an admin operator? Please specify an operational justification:"
        confirmLabel="Confirm Cancellation"
        confirmVariant="danger"
        isConfirmDisabled={!cancelReason.trim()}
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onClose={() => setCancelModalBooking(null)}
      >
        <textarea
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            fontSize: 13,
            minHeight: 80,
            fontFamily: 'inherit',
          }}
          placeholder="e.g. Customer requested cancellation via phone helpline due to scheduling conflict"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </ConfirmationModal>
    </div>
  );
}
