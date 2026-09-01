'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listAdminProfessionals } from '@/lib/api';

export default function ProfessionalsPage(): ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-professionals'],
    queryFn: listAdminProfessionals,
  });

  const professionals = (data?.items ?? []).map((person) => ({
    name: person.businessName,
    service: 'Service profile',
    status: person.verificationStatus,
    risk: person.onlineStatus === 'ONLINE' ? 'Low' : 'Medium',
  }));
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 48px' }}>
      <h1 style={{ marginBottom: 20 }}>Professionals</h1>
      {isLoading && <p>Loading professionals…</p>}
      {error && <p>Unable to load professionals right now.</p>}
      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: 'var(--color-background)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Service</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {professionals.map((person) => (
              <tr key={person.name} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px' }}>{person.name}</td>
                <td style={{ padding: '12px 16px' }}>{person.service}</td>
                <td style={{ padding: '12px 16px' }}>{person.status}</td>
                <td style={{ padding: '12px 16px' }}>{person.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
