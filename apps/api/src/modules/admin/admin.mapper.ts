import type { AuditLog, Category, Service } from '@prisma/client';
import type {
  AdminDocumentDetail,
  AdminProfessionalDetail,
  AdminProfessionalSummary,
  AuditLogEntry,
  IsoTimestamp,
  ServiceDetail,
  Uuid,
} from '@nest/types';
import { toServiceDetail } from '../catalog/catalog.mapper';
import type { AdminProfessionalRecord } from './admin.service';

/**
 * Admin mappers.
 *
 * These responses intentionally carry more than the customer-facing ones — the
 * applicant's identity and verification state. Keeping them in a separate mapper
 * from the public one is what stops those fields drifting into a customer
 * response.
 */

export function toAdminProfessionalSummary(
  professional: AdminProfessionalRecord,
): AdminProfessionalSummary {
  return {
    id: professional.id as Uuid,
    businessName: professional.businessName,
    verificationStatus: professional.verificationStatus,
    onlineStatus: professional.onlineStatus,
    documentCount: professional._count.documents,
    createdAt: professional.createdAt.toISOString() as IsoTimestamp,
    updatedAt: professional.updatedAt.toISOString() as IsoTimestamp,
  };
}

export function toAdminProfessionalDetail(
  professional: AdminProfessionalRecord,
  signedUrls: Map<string, { url: string; expiresAt: Date }>,
): AdminProfessionalDetail {
  const documents: AdminDocumentDetail[] = professional.documents.map((document) => {
    const signed = signedUrls.get(document.id);

    return {
      id: document.id as Uuid,
      documentType: document.documentType,
      verificationStatus: document.verificationStatus,
      // Empty rather than a guessed link if signing failed: a broken URL is
      // better than one that points somewhere unintended.
      downloadUrl: signed?.url ?? '',
      downloadUrlExpiresAt: (signed?.expiresAt.toISOString() ??
        new Date(0).toISOString()) as IsoTimestamp,
      expiresAt: (document.expiresAt?.toISOString() ?? null) as IsoTimestamp | null,
      reviewedAt: (document.reviewedAt?.toISOString() ?? null) as IsoTimestamp | null,
      createdAt: document.createdAt.toISOString() as IsoTimestamp,
    };
  });

  return {
    ...toAdminProfessionalSummary(professional),
    bio: professional.bio,
    yearsExperience: professional.yearsExperience,
    completedJobs: professional.completedJobs,
    reviewNotes: professional.reviewNotes,
    reviewedAt: (professional.reviewedAt?.toISOString() ?? null) as IsoTimestamp | null,
    user: {
      id: professional.user.id as Uuid,
      phone: professional.user.phone,
      name: professional.user.name,
      email: professional.user.email,
    },
    documents,
    serviceAreas: professional.serviceAreas.map((area) => ({
      locality: area.locality,
      pincode: area.pincode,
    })),
  };
}

export function toAdminServiceDetail(service: Service & { category: Category }): ServiceDetail {
  return toServiceDetail(service);
}

export function toAuditLogEntry(entry: AuditLog): AuditLogEntry {
  return {
    id: entry.id as Uuid,
    actorId: (entry.actorId ?? null) as Uuid | null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    before: asRecord(entry.beforeJson),
    after: asRecord(entry.afterJson),
    createdAt: entry.createdAt.toISOString() as IsoTimestamp,
  };
}

/** Narrows a Prisma JSON column to an object, or null for anything else. */
function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
