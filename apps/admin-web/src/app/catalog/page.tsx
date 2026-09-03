'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { createAdminService, getServices, updateAdminService } from '@/lib/api';
import {
  CatalogIcon,
  ConfirmationModal,
  EmptyState,
  LoadingSkeleton,
  StatusBadge,
} from '@/components';

export default function CatalogPage(): ReactElement {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<{
    id: string;
    name: string;
    description: string;
    basePriceRupees: string;
    active: boolean;
  } | null>(null);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [basePriceRupees, setBasePriceRupees] = useState('499');

  const { data, isLoading, error } = useQuery({
    queryKey: ['catalog-services'],
    queryFn: getServices,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminService({
        name: name.trim(),
        categoryId: categoryId || (data?.categories[0]?.id ?? ''),
        description: description.trim() || undefined,
        basePriceMinor: Math.round(Number(basePriceRupees) * 100),
      }),
    onSuccess: () => {
      setShowAddModal(false);
      setName('');
      setDescription('');
      void queryClient.invalidateQueries({ queryKey: ['catalog-services'] });
      alert('Service created successfully in catalog!');
    },
    onError: (err: Error) => alert(`Failed to create service: ${err.message}`),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateAdminService(editingService!.id, {
        name: editingService!.name.trim(),
        description: editingService!.description.trim() || undefined,
        basePriceMinor: Math.round(Number(editingService!.basePriceRupees) * 100),
        active: editingService!.active,
      }),
    onSuccess: () => {
      setEditingService(null);
      void queryClient.invalidateQueries({ queryKey: ['catalog-services'] });
      alert('Service updated successfully!');
    },
    onError: (err: Error) => alert(`Failed to update service: ${err.message}`),
  });

  const categories = data?.categories ?? [];
  const services = categories.flatMap((cat) =>
    cat.services.map((svc) => ({
      ...svc,
      categoryName: cat.name,
    })),
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
            SERVICE DIRECTORY & PRICING
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: 'var(--color-text-main)' }}>
            Catalog Management
          </h1>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowAddModal(true);
            if (categories.length > 0) {
              setCategoryId(categories[0]!.id);
            }
          }}
        >
          + Add New Service
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} height={52} />
      ) : error ? (
        <div style={{ color: 'var(--color-danger)', padding: 16 }}>
          Error loading catalog services.
        </div>
      ) : (
        /* Services Table */
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Base Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <EmptyState
                      title="Catalog Empty"
                      description="No services have been configured yet."
                      icon={<CatalogIcon />}
                    />
                  </td>
                </tr>
              ) : null}

              {services.map((svc) => (
                <tr key={svc.id}>
                  <td style={{ fontWeight: 700 }}>{svc.name}</td>
                  <td>
                    <StatusBadge status={svc.categoryName} type="primary" />
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12, maxWidth: 360 }}>
                    {svc.description ?? 'Standard home service & diagnostic inspection'}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {svc.basePriceMinor ? `₹${(svc.basePriceMinor / 100).toFixed(0)}` : 'Quote on Inspection'}
                  </td>
                  <td>
                    <StatusBadge status="ACTIVE" type="success" />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() =>
                        setEditingService({
                          id: svc.id,
                          name: svc.name,
                          description: svc.description ?? '',
                          basePriceRupees: svc.basePriceMinor
                            ? String(svc.basePriceMinor / 100)
                            : '499',
                          active: true,
                        })
                      }
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Service Modal */}
      <ConfirmationModal
        isOpen={showAddModal}
        title="Create New Platform Service"
        description="Add a new service offering to the customer discovery catalog:"
        confirmLabel="Save Service"
        confirmVariant="primary"
        isConfirmDisabled={!name.trim()}
        isLoading={createMutation.isPending}
        onConfirm={() => createMutation.mutate()}
        onClose={() => setShowAddModal(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              SERVICE NAME
            </label>
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', marginTop: 4 }}
              placeholder="e.g. Geyser Installation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              CATEGORY
            </label>
            <select
              className="filter-select"
              style={{ width: '100%', marginTop: 4 }}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              BASE PRICE (₹)
            </label>
            <input
              type="number"
              className="search-input"
              style={{ width: '100%', marginTop: 4 }}
              value={basePriceRupees}
              onChange={(e) => setBasePriceRupees(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              DESCRIPTION
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                fontSize: 13,
                minHeight: 60,
                marginTop: 4,
                fontFamily: 'inherit',
              }}
              placeholder="Brief service description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </ConfirmationModal>

      {/* Edit Service Modal */}
      <ConfirmationModal
        isOpen={Boolean(editingService)}
        title={`Edit Service: ${editingService?.name}`}
        description="Update service naming, baseline pricing, or description:"
        confirmLabel="Update Service"
        confirmVariant="primary"
        isConfirmDisabled={!editingService?.name.trim()}
        isLoading={editMutation.isPending}
        onConfirm={() => editMutation.mutate()}
        onClose={() => setEditingService(null)}
      >
        {editingService ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                SERVICE NAME
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', marginTop: 4 }}
                value={editingService.name}
                onChange={(e) =>
                  setEditingService({ ...editingService, name: e.target.value })
                }
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                BASE PRICE (₹)
              </label>
              <input
                type="number"
                className="search-input"
                style={{ width: '100%', marginTop: 4 }}
                value={editingService.basePriceRupees}
                onChange={(e) =>
                  setEditingService({ ...editingService, basePriceRupees: e.target.value })
                }
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                DESCRIPTION
              </label>
              <textarea
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  fontSize: 13,
                  minHeight: 60,
                  marginTop: 4,
                  fontFamily: 'inherit',
                }}
                value={editingService.description}
                onChange={(e) =>
                  setEditingService({ ...editingService, description: e.target.value })
                }
              />
            </div>
          </div>
        ) : null}
      </ConfirmationModal>
    </div>
  );
}
