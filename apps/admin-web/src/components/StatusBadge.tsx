import type { ReactElement } from 'react';

export interface StatusBadgeProps {
  status: string;
  type?: 'success' | 'warning' | 'danger' | 'primary' | 'neutral';
}

export function StatusBadge({ status, type }: StatusBadgeProps): ReactElement {
  const resolvedType =
    type ??
    (() => {
      switch (status.toUpperCase()) {
        case 'COMPLETED':
        case 'PAID':
        case 'RESOLVED':
        case 'APPROVED':
        case 'VERIFIED':
        case 'ONLINE':
        case 'ACTIVE':
          return 'success';
        case 'REQUESTED':
        case 'PENDING':
        case 'PENDING_REVIEW':
        case 'ARRIVING':
        case 'ARRIVED':
        case 'IN_PROGRESS':
        case 'CHANGES_REQUESTED':
          return 'warning';
        case 'CANCELLED':
        case 'CANCELLED_BY_CUSTOMER':
        case 'CANCELLED_BY_PROFESSIONAL':
        case 'CANCELLED_BY_ADMIN':
        case 'REJECTED':
        case 'FAILED':
        case 'REFUNDED':
        case 'HIGH':
          return 'danger';
        case 'ACCEPTED':
        case 'MEDIUM':
          return 'primary';
        default:
          return 'neutral';
      }
    })();

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span className={`status-badge status-badge-${resolvedType}`}>
      {formatText(status)}
    </span>
  );
}
