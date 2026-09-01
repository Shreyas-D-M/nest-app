'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { getServices } from '@/lib/api';

export default function CatalogPage(): ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: getServices,
  });

  const services = (data?.categories ?? []).flatMap((category) =>
    category.services.map((service) => ({
      id: service.id,
      name: service.name,
      status: 'Active',
      basePrice:
        service.basePriceMinor != null ? `₹${(service.basePriceMinor / 100).toFixed(0)}` : 'Estimate',
    })),
  );
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 48px' }}>
      <h1 style={{ marginBottom: 20 }}>Catalog & services</h1>
      {isLoading && <p>Loading catalog…</p>}
      {error && <p>Unable to load the catalog right now.</p>}
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
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Service</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Base price</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px' }}>{service.id}</td>
                <td style={{ padding: '12px 16px' }}>{service.name}</td>
                <td style={{ padding: '12px 16px' }}>{service.basePrice}</td>
                <td style={{ padding: '12px 16px' }}>{service.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
