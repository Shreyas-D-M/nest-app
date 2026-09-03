'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { listAdminPayments, refundAdminPayment, type AdminPaymentItem } from '@/lib/api';
import {
  ConfirmationModal,
  EmptyState,
  LoadingSkeleton,
  PaymentsIcon,
  SearchIcon,
  StatusBadge,
} from '@/components';

const STATUS_FILTERS = ['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'];

export default function PaymentsPage(): ReactElement {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refundModalPayment, setRefundModalPayment] = useState<AdminPaymentItem | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-payments', selectedStatus],
    queryFn: () =>
      listAdminPayments(selectedStatus === 'ALL' ? undefined : selectedStatus),
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      refundAdminPayment(refundModalPayment!.id, {
        amountMinor: refundModalPayment!.amountMinor,
        reason: refundReason.trim(),
      }),
    onSuccess: () => {
      setRefundModalPayment(null);
      setRefundReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      alert('Payment refund initiated and recorded successfully!');
    },
    onError: (err: Error) => alert(`Refund failed: ${err.message}`),
  });

  const payments = data?.items ?? [];

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      (p.bookingId ?? '').toLowerCase().includes(q) ||
      (p.provider ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
          FINANCIAL AUDIT & TRANSACTIONS
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: 'var(--color-text-main)' }}>
          Payments & Settlement Ledger
        </h1>
      </div>

      {/* Toolbar */}
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
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <SearchIcon style={{ position: 'absolute', left: 10, color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search payment or booking ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} height={52} />
      ) : error ? (
        <div style={{ color: 'var(--color-danger)', padding: 16 }}>
          Error loading payment transactions.
        </div>
      ) : (
        /* Table */
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Booking Ref</th>
                <th>Provider / Gateway</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <EmptyState
                      title="No Payment Transactions"
                      description="No payment transactions recorded for the selected filter."
                      icon={<PaymentsIcon />}
                    />
                  </td>
                </tr>
              ) : null}

              {filteredPayments.map((p) => {
                const canRefund =
                  p.status === 'COMPLETED' || p.status === 'SUCCEEDED' || p.status === 'PAID';

                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{p.id.slice(0, 8)}</td>
                    <td style={{ fontFamily: 'monospace' }}>
                      {p.bookingId ? p.bookingId.slice(0, 8) : '—'}
                    </td>
                    <td>{p.provider ?? 'RAZORPAY'}</td>
                    <td style={{ fontWeight: 700 }}>₹{(p.amountMinor / 100).toFixed(0)}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleString()}</td>
                    <td>
                      {canRefund ? (
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => {
                            setRefundModalPayment(p);
                            setRefundReason('');
                          }}
                        >
                          Issue Refund
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

      {/* Refund Modal */}
      <ConfirmationModal
        isOpen={Boolean(refundModalPayment)}
        title={`Initiate Customer Refund (₹${
          refundModalPayment ? (refundModalPayment.amountMinor / 100).toFixed(0) : 0
        })`}
        description={`Confirm refund processing for Payment ID ${refundModalPayment?.id.slice(
          0,
          8,
        )}. This action will return funds to the customer account:`}
        confirmLabel="Confirm Refund"
        confirmVariant="danger"
        isConfirmDisabled={!refundReason.trim()}
        isLoading={refundMutation.isPending}
        onConfirm={() => refundMutation.mutate()}
        onClose={() => setRefundModalPayment(null)}
      >
        <textarea
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            fontSize: 13,
            minHeight: 70,
            fontFamily: 'inherit',
          }}
          placeholder="e.g. Appointment cancelled / quality resolution guarantee"
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
        />
      </ConfirmationModal>
    </div>
  );
}
