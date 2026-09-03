'use client';

import type { ReactElement } from 'react';
import { BellIcon, SearchIcon } from './Icons';

export interface AdminHeaderProps {
  title?: string;
  onSearch?: (query: string) => void;
}

export function AdminHeader({ title = 'HYPERLOCAL MARKETPLACE OPERATIONS', onSearch }: AdminHeaderProps): ReactElement {
  return (
    <header className="admin-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
          {title}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Global Quick Search Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <SearchIcon
            style={{
              position: 'absolute',
              left: 10,
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: 34, width: 240, height: 36 }}
            placeholder="Quick search platform…"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        {/* Region Badge */}
        <span
          style={{
            padding: '5px 12px',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            fontSize: '11.5px',
            fontWeight: 700,
          }}
        >
          Region: Belagavi HQ
        </span>

        {/* Notification Bell */}
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            color: 'var(--color-text-secondary)',
          }}
          onClick={() => alert('All system background jobs, OTP queues, and webhook listeners are operational.')}
          title="System Notifications"
        >
          <BellIcon />
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'var(--color-success)',
            }}
          />
        </button>

        {/* Admin Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
          }}
          title="Admin Operator"
        >
          AD
        </div>
      </div>
    </header>
  );
}
