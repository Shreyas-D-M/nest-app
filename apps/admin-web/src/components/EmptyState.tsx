import type { ReactElement, ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid var(--border-color)',
      }}
    >
      {icon ? (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            marginBottom: 4,
          }}
        >
          {icon}
        </div>
      ) : null}

      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-main)' }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 420, lineHeight: 1.5 }}>
        {description}
      </p>

      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );
}
