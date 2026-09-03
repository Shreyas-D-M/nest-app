'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { listAdminAuditLogs } from '@/lib/api';
import {
  AuditIcon,
  EmptyState,
  LoadingSkeleton,
  SearchIcon,
  StatusBadge,
} from '@/components';

export default function AuditTrailPage(): ReactElement {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: listAdminAuditLogs,
  });

  const logs = data?.items ?? [];

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorType.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
          SECURITY & COMPLIANCE
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: 'var(--color-text-main)' }}>
          Platform Audit Trail
        </h1>
      </div>

      {/* Toolbar */}
      <div className="toolbar-container">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <SearchIcon style={{ position: 'absolute', left: 10, color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: 34, width: 320 }}
            placeholder="Search action, entity type, actor…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} height={52} />
      ) : error ? (
        <div style={{ color: 'var(--color-danger)', padding: 16 }}>
          Error loading platform audit logs.
        </div>
      ) : (
        /* Table */
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor Type</th>
                <th>Entity Type</th>
                <th>Entity Reference</th>
                <th>Metadata Payload</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <EmptyState
                      title="No Audit Records"
                      description="No platform event logs match the current search."
                      icon={<AuditIcon />}
                    />
                  </td>
                </tr>
              ) : null}

              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <StatusBadge status={log.action} type="primary" />
                  </td>
                  <td>
                    <StatusBadge status={log.actorType} type="neutral" />
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.entityType}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.entityId.slice(0, 12)}…</td>
                  <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-secondary)', maxWidth: 320 }}>
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
