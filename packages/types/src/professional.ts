import type { MinorUnits } from './money';
import type { IsoTimestamp, Uuid } from './primitives';
import type { PricingType } from './catalog';

/**
 * Professionals — supply side.
 *
 * Two distinct representations, and the difference is a trust boundary:
 *
 *   `PublicProfessional`  — what a customer may see. Contains no contact details
 *                           and no verification information beyond the fact of
 *                           approval.
 *   `ProfessionalProfile` — what the professional themself sees, including their
 *                           verification state and any admin feedback.
 */

export const VERIFICATION_STATUSES = [
  'UNSUBMITTED',
  'PENDING_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const ONLINE_STATUSES = ['ONLINE', 'OFFLINE'] as const;

export type OnlineStatus = (typeof ONLINE_STATUSES)[number];

export const DOCUMENT_TYPES = [
  'IDENTITY_PROOF',
  'ADDRESS_PROOF',
  'BUSINESS_REGISTRATION',
  'QUALIFICATION',
  'BANK_PROOF',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_VERIFICATION_STATUSES = ['PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const;

export type DocumentVerificationStatus = (typeof DOCUMENT_VERIFICATION_STATUSES)[number];

/** ISO-8601 weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/** Minutes in a day — the exclusive upper bound for a window end. */
export const MINUTES_PER_DAY = 1440;

/**
 * A recurring weekly working window, in local wall-clock minutes from midnight.
 *
 * Not an instant: `540` means "09:00 local", every week. The operating timezone
 * is Asia/Kolkata for the Belagavi launch.
 */
export interface AvailabilityWindow {
  weekday: Weekday;
  /** Inclusive start. 09:00 → 540. */
  startMinute: number;
  /** Exclusive end. 18:00 → 1080. */
  endMinute: number;
}

export interface ServiceArea {
  locality: string;
  pincode: string;
}

/** A service a professional offers, with their price. */
export interface ProfessionalServiceOffering {
  serviceId: Uuid;
  serviceName: string;
  pricingType: PricingType;
  basePriceMinor: MinorUnits;
}

/**
 * A professional as shown to a customer.
 *
 * Only ever produced for an APPROVED professional. There is no verification
 * field: the presence of this representation *is* the approval, and CLAUDE.md
 * forbids implying verification in any other state.
 *
 * `rating` is deliberately absent until reviews exist — a placeholder average
 * would be a fabricated metric.
 */
export interface PublicProfessional {
  id: Uuid;
  businessName: string;
  bio: string | null;
  yearsExperience: number;
  onlineStatus: OnlineStatus;
  completedJobs: number;
  services: ProfessionalServiceOffering[];
  serviceAreas: ServiceArea[];
}

/** A professional's own profile. */
export interface ProfessionalProfile {
  id: Uuid;
  businessName: string;
  bio: string | null;
  yearsExperience: number;
  verificationStatus: VerificationStatus;
  onlineStatus: OnlineStatus;
  completedJobs: number;
  /** Admin feedback when changes were requested or the application was rejected. */
  reviewNotes: string | null;
  reviewedAt: IsoTimestamp | null;
  services: ProfessionalServiceOffering[];
  serviceAreas: ServiceArea[];
  availability: AvailabilityWindow[];
  documents: ProfessionalDocumentSummary[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/**
 * Document metadata.
 *
 * The storage key never leaves the server. A document is retrieved through a
 * short-lived signed URL, so a leaked response cannot become durable access to
 * someone's identity papers.
 */
export interface ProfessionalDocumentSummary {
  id: Uuid;
  documentType: DocumentType;
  verificationStatus: DocumentVerificationStatus;
  expiresAt: IsoTimestamp | null;
  reviewedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
}

/** `GET /professionals/:id/availability`. */
export interface ProfessionalAvailabilityResponse {
  /** IANA timezone the windows are expressed in. */
  timezone: string;
  windows: AvailabilityWindow[];
}

export const PROFESSIONAL_ERROR_CODES = {
  /** The caller has no professional record. */
  NOT_A_PROFESSIONAL: 'NOT_A_PROFESSIONAL',
  /** The caller already has one; onboarding is once per user. */
  ALREADY_A_PROFESSIONAL: 'ALREADY_A_PROFESSIONAL',
  /** The action requires a completed verification. */
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  /** The requested verification transition is not legal from the current state. */
  INVALID_VERIFICATION_TRANSITION: 'INVALID_VERIFICATION_TRANSITION',
  /** Documents must exist before a review can be requested. */
  DOCUMENTS_REQUIRED: 'DOCUMENTS_REQUIRED',
  /** Document storage is not configured on this deployment. */
  DOCUMENT_STORAGE_NOT_CONFIGURED: 'DOCUMENT_STORAGE_NOT_CONFIGURED',
} as const;

export type ProfessionalErrorCode =
  (typeof PROFESSIONAL_ERROR_CODES)[keyof typeof PROFESSIONAL_ERROR_CODES];
