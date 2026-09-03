'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactElement } from 'react';
import {
  AuditIcon,
  BookingsIcon,
  CatalogIcon,
  OverviewIcon,
  PaymentsIcon,
  ProfessionalsIcon,
  SupportIcon,
} from './Icons';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: OverviewIcon },
  { href: '/bookings', label: 'Bookings', icon: BookingsIcon },
  { href: '/professionals', label: 'Professionals', icon: ProfessionalsIcon },
  { href: '/catalog', label: 'Catalog & Services', icon: CatalogIcon },
  { href: '/payments', label: 'Payments & Refunds', icon: PaymentsIcon },
  { href: '/support', label: 'Support Queue', icon: SupportIcon },
  { href: '/audit', label: 'Audit Trail', icon: AuditIcon },
];

export function Sidebar(): ReactElement {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            backgroundColor: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          N
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
            NEST
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--color-primary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Operations Console
          </div>
        </div>
      </div>

      {/* Navigation Links with Active State */}
      <nav
        style={{
          padding: '16px 12px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Health / Operator Footer */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'var(--color-success)',
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-success-text)' }}>
            NestJS Engine: Online
          </span>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Operator: <strong style={{ color: 'var(--color-text-main)' }}>Operations HQ</strong>
        </div>
      </div>
    </aside>
  );
}
