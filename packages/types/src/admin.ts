import type { IsoTimestamp, Uuid } from './primitives';

/**
 * Admin contracts.
 *
 * Admin representations are intentionally richer than customer-facing ones —
 * an admin reviewing an application needs the verification state and the
 * applicant's identity. That is precisely why these types are separate: the
 * extra fields must never reach a customer response by accident.
 */

/** A row in the verification queue. */
export interface AdminProfessionalSummary {
  id: Uuid;
  businessName: string;
  verificationStatus: string;
  onlineStatus: string;
  documentCount: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** Full detail for a verification decision. */
export interface AdminProfessionalDetail extends AdminProfessionalSummary {
  bio: string | null;
  yearsExperience: number;
  completedJobs: number;
  reviewNotes: string | null;
  reviewedAt: IsoTimestamp | null;
  /** Applicant identity. Visible to admins only. */
  user: {
    id: Uuid;
    phone: string;
    name: string | null;
    email: string | null;
  };
  documents: AdminDocumentDetail[];
  serviceAreas: { locality: string; pincode: string }[];
}

/**
 * A document as an admin sees it.
 *
 * `downloadUrl` is a short-lived signed URL minted per request, never a durable
 * link, so a stale response cannot be replayed to reach someone's papers.
 */
export interface AdminDocumentDetail {
  id: Uuid;
  documentType: string;
  verificationStatus: string;
  downloadUrl: string;
  downloadUrlExpiresAt: IsoTimestamp;
  expiresAt: IsoTimestamp | null;
  reviewedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
}

/** An entry in the audit trail. */
export interface AuditLogEntry {
  id: Uuid;
  actorId: Uuid | null;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: IsoTimestamp;
}

/** Cursor-free offset pagination for admin lists. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const ADMIN_ERROR_CODES = {
  /** The caller is authenticated but lacks the required role. */
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
} as const;

export type AdminErrorCode = (typeof ADMIN_ERROR_CODES)[keyof typeof ADMIN_ERROR_CODES];

/**
 * Audit action names.
 *
 * Constants rather than free strings so that a rename cannot silently orphan the
 * history: the audit trail is only useful if the same action always has the same
 * name.
 */
export const AUDIT_ACTIONS = {
  PROFESSIONAL_APPROVE: 'professional.approve',
  PROFESSIONAL_REJECT: 'professional.reject',
  PROFESSIONAL_REQUEST_CHANGES: 'professional.request_changes',
  SERVICE_CREATE: 'service.create',
  SERVICE_UPDATE: 'service.update',
  BOOKING_CREATE: 'booking.create',
  BOOKING_CANCEL: 'booking.cancel',
  PAYMENT_INITIATE: 'payment.initiate',
  EXTRA_WORK_APPROVE: 'extra_work.approve',
  EXTRA_WORK_REJECT: 'extra_work.reject',
  SUPPORT_TICKET_ASSIGN: 'support.assign',
  SUPPORT_TICKET_RESOLVE: 'support.resolve',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
