'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import {
  approveProfessional,
  getProfessionalDocuments,
  listAdminProfessionals,
  rejectProfessional,
  requestChangesProfessional,
  type AdminProfessionalSummary,
} from '@/lib/api';
import {
  ConfirmationModal,
  EmptyState,
  LoadingSkeleton,
  ProfessionalsIcon,
  SearchIcon,
  StatusBadge,
} from '@/components';

const STATUS_TABS = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'];

export default function ProfessionalsPage(): ReactElement {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionModal, setDecisionModal] = useState<{
    pro: AdminProfessionalSummary;
    action: 'APPROVE' | 'REJECT' | 'CHANGES';
  } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [docViewerPro, setDocViewerPro] = useState<AdminProfessionalSummary | null>(null);
  const [docUrls, setDocUrls] = useState<Record<string, string> | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-professionals', selectedTab],
    queryFn: () =>
      listAdminProfessionals(selectedTab === 'ALL' ? undefined : selectedTab),
  });

  const decisionMutation = useMutation({
    mutationFn: async () => {
      if (!decisionModal) return;
      if (decisionModal.action === 'APPROVE') {
        await approveProfessional(decisionModal.pro.id, decisionReason || 'Verified by operations desk');
      } else if (decisionModal.action === 'REJECT') {
        await rejectProfessional(decisionModal.pro.id, decisionReason.trim());
      } else {
        await requestChangesProfessional(decisionModal.pro.id, decisionReason.trim());
      }
    },
    onSuccess: () => {
      const act = decisionModal?.action;
      setDecisionModal(null);
      setDecisionReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin-professionals'] });
      alert(
        act === 'APPROVE'
          ? 'Professional approved and activated successfully!'
          : act === 'REJECT'
          ? 'Professional application marked rejected.'
          : 'Changes requested from professional successfully.',
      );
    },
    onError: (err: Error) => alert(`Action failed: ${err.message}`),
  });

  const handleInspectDocs = async (pro: AdminProfessionalSummary) => {
    setDocViewerPro(pro);
    setDocsLoading(true);
    try {
      const urls = await getProfessionalDocuments(pro.id);
      setDocUrls(urls);
    } catch {
      setDocUrls({});
    } finally {
      setDocsLoading(false);
    }
  };

  const pros = data?.items ?? [];
  const filteredPros = pros.filter((p) => {
    if (!searchQuery.trim()) return true;
    return p.businessName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
          SUPPLY & ONBOARDING
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: 'var(--color-text-main)' }}>
          Professionals & KYC Verification
        </h1>
      </div>

      {/* Toolbar */}
      <div className="toolbar-container">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`btn ${selectedTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => setSelectedTab(tab)}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <SearchIcon style={{ position: 'absolute', left: 10, color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search by business name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} height={52} />
      ) : error ? (
        <div style={{ color: 'var(--color-danger)', padding: 16 }}>
          Error loading professionals queue.
        </div>
      ) : (
        /* Table */
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Business / Specialist</th>
                <th>KYC Status</th>
                <th>Live Availability</th>
                <th>Verification Documents</th>
                <th>Onboarded Date</th>
                <th>Operational Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPros.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <EmptyState
                      title="No Professionals Found"
                      description="No professionals match the selected verification status."
                      icon={<ProfessionalsIcon />}
                    />
                  </td>
                </tr>
              ) : null}

              {filteredPros.map((pro) => {
                const isVerified =
                  pro.verificationStatus === 'APPROVED' || pro.verificationStatus === 'VERIFIED';
                const isRejected = pro.verificationStatus === 'REJECTED';
                const isChangesRequested = pro.verificationStatus === 'CHANGES_REQUESTED';

                return (
                  <tr key={pro.id}>
                    <td style={{ fontWeight: 700 }}>{pro.businessName}</td>
                    <td>
                      <StatusBadge status={pro.verificationStatus} />
                    </td>
                    <td>
                      <StatusBadge status={pro.onlineStatus} />
                    </td>
                    <td>
                      {(() => {
                        const docCount =
                          pro.documentCount ??
                          (pro as unknown as { _count?: { documents?: number } })._count?.documents ??
                          0;
                        return (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: 11, padding: '5px 12px' }}
                            onClick={() => void handleInspectDocs(pro)}
                          >
                            Inspect {docCount} Document{docCount === 1 ? '' : 's'}
                          </button>
                        );
                      })()}
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(pro.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!isVerified ? (
                          <button
                            type="button"
                            className="btn btn-success"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => {
                              setDecisionModal({ pro, action: 'APPROVE' });
                              setDecisionReason('Verified identity documents and trade qualifications.');
                            }}
                          >
                            Approve
                          </button>
                        ) : null}

                        {!isRejected ? (
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => {
                              setDecisionModal({ pro, action: 'REJECT' });
                              setDecisionReason('');
                            }}
                          >
                            Reject
                          </button>
                        ) : null}

                        {!isChangesRequested ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => {
                              setDecisionModal({ pro, action: 'CHANGES' });
                              setDecisionReason('');
                            }}
                          >
                            Request Changes
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(decisionModal)}
        title={
          decisionModal?.action === 'APPROVE'
            ? `Approve Verification: ${decisionModal.pro.businessName}`
            : decisionModal?.action === 'REJECT'
            ? `Reject Onboarding: ${decisionModal.pro.businessName}`
            : `Request Changes: ${decisionModal?.pro.businessName}`
        }
        description={
          decisionModal?.action === 'APPROVE'
            ? 'Approving this professional will activate their partner account to start receiving customer job dispatches.'
            : 'Please specify the exact justification or required KYC corrections:'
        }
        confirmLabel={
          decisionModal?.action === 'APPROVE'
            ? 'Confirm Approval'
            : decisionModal?.action === 'REJECT'
            ? 'Confirm Rejection'
            : 'Submit Changes Request'
        }
        confirmVariant={
          decisionModal?.action === 'APPROVE'
            ? 'success'
            : decisionModal?.action === 'REJECT'
            ? 'danger'
            : 'primary'
        }
        isConfirmDisabled={decisionModal?.action !== 'APPROVE' && !decisionReason.trim()}
        isLoading={decisionMutation.isPending}
        onConfirm={() => decisionMutation.mutate()}
        onClose={() => setDecisionModal(null)}
      >
        <textarea
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            fontSize: 13,
            minHeight: 80,
            fontFamily: 'inherit',
          }}
          placeholder={
            decisionModal?.action === 'APPROVE'
              ? 'Optional verification notes (internal)'
              : 'e.g. Government identity card copy is blurry; please upload a clear scan.'
          }
          value={decisionReason}
          onChange={(e) => setDecisionReason(e.target.value)}
        />
      </ConfirmationModal>

      {/* Document Viewer Modal */}
      <ConfirmationModal
        isOpen={Boolean(docViewerPro)}
        title={`KYC Documents: ${docViewerPro?.businessName}`}
        description="Inspect uploaded identity verification and qualification certificates:"
        confirmLabel="Done Inspecting"
        onConfirm={() => setDocViewerPro(null)}
        onClose={() => setDocViewerPro(null)}
      >
        {docsLoading ? (
          <LoadingSkeleton rows={2} height={42} />
        ) : docUrls && Object.keys(docUrls).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '12px 0' }}>
            {Object.entries(docUrls).map(([docId, url]) => (
              <div
                key={docId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>Attachment #{docId.slice(0, 8)}</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: 11, padding: '4px 12px' }}
                >
                  Open Signed File ↗
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)', margin: '12px 0' }}>
            No document attachments were found for this professional profile.
          </p>
        )}
      </ConfirmationModal>
    </div>
  );
}
