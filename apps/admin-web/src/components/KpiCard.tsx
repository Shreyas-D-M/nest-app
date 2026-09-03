import type { ReactElement, ReactNode } from 'react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'primary' | 'neutral';
  icon?: ReactNode;
}

export function KpiCard({
  label,
  value,
  subtitle,
  badge,
  badgeType = 'neutral',
  icon,
}: KpiCardProps): ReactElement {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="stat-card-label">{label}</span>
        {icon ? <span style={{ color: 'var(--color-primary)' }}>{icon}</span> : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <p className="stat-card-value">{value}</p>
        {badge ? (
          <span className={`status-badge status-badge-${badgeType}`}>
            {badge}
          </span>
        ) : null}
      </div>

      {subtitle ? <span className="stat-card-sub">{subtitle}</span> : null}
    </div>
  );
}
