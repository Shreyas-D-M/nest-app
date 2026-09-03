/**
 * Service request types, enums, and error codes.
 *
 * Covers customer natural-language service requests with optional AI classification.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const SERVICE_REQUEST_STATUSES = [
  'DRAFT',
  'CLARIFYING',
  'READY',
  'MATCHED',
  'CANCELLED',
] as const;

export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const SERVICE_REQUEST_DOCUMENT_TYPES = [
  'SERVICE_REQUEST_MEDIA',
] as const;

export type ServiceRequestDocumentType = (typeof SERVICE_REQUEST_DOCUMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export const SERVICE_REQUEST_ERROR_CODES = {
  NOT_FOUND: 'service_request:not_found',
  NOT_AUTHORIZED: 'service_request:not_authorized',
  ALREADY_MATCHED: 'service_request:already_matched',
  INVALID_STATUS: 'service_request:invalid_status',
  ATTACHMENT_TOO_LARGE: 'service_request:attachment_too_large',
  UNSUPPORTED_MEDIA_TYPE: 'service_request:unsupported_media_type',
} as const;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * A customer's natural-language service request.
 */
export interface ServiceRequest {
  id: string;
  customerId: string;
  addressId: string | null;
  rawText: string;
  voiceUrl: string | null;
  media: string[] | null;
  aiCategory: string | null;
  aiConfidence: number | null;
  status: ServiceRequestStatus;
  createdAt: Date;
}

/**
 * An attached photo or document.
 */
export interface ServiceRequestAttachment {
  id: string;
  requestId: string;
  storageUrl: string;
  contentType: string;
  createdAt: Date;
}

/**
 * Customer's view of their service request.
 */
export interface ServiceRequestView {
  id: string;
  rawText: string;
  voiceUrl: string | null;
  media: string[] | null;
  aiCategory: string | null;
  aiConfidence: number | null;
  status: ServiceRequestStatus;
  createdAt: Date;
  address: {
    id: string;
    label: string;
    locality: string;
    city: string;
  } | null;
  /** Set when this request resulted in a booking. */
  bookingId: string | null;
}
