import type { ReactElement, ReactNode } from 'react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  isConfirmDisabled?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm Action',
  confirmVariant = 'primary',
  isConfirmDisabled = false,
  isLoading = false,
  onConfirm,
  onClose,
  children,
}: ConfirmationModalProps): ReactElement | null {
  if (!isOpen) return null;

  const btnClass =
    confirmVariant === 'danger'
      ? 'btn-danger'
      : confirmVariant === 'success'
      ? 'btn-success'
      : 'btn-primary';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--color-text-main)' }}>
          {title}
        </h3>

        {description ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
            {description}
          </p>
        ) : null}

        {children ? <div style={{ marginBottom: 16 }}>{children}</div> : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${btnClass}`}
            disabled={isConfirmDisabled || isLoading}
            onClick={onConfirm}
          >
            {isLoading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
