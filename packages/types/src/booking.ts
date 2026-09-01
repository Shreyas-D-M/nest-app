/**
 * Booking types, enums, and error codes.
 *
 * Covers bookings, booking items, extra work requests, and status history.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const BOOKING_STATUSES = [
  'REQUESTED',
  'ACCEPTED',
  'ARRIVING',
  'ARRIVED',
  'IN_PROGRESS',
  'EXTRA_APPROVAL_PENDING',
  'COMPLETED',
  'PAYMENT_PENDING',
  'PAID',
  'REVIEWED',
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_PROFESSIONAL',
  'CANCELLED_BY_ADMIN',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ACTOR_TYPES = ['CUSTOMER', 'PROFESSIONAL', 'ADMIN', 'SYSTEM'] as const;

export type ActorType = (typeof ACTOR_TYPES)[number];

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export const BOOKING_ERROR_CODES = {
  NOT_FOUND: 'booking:not_found',
  INVALID_STATUS_TRANSITION: 'booking:invalid_status_transition',
  CANNOT_CANCEL: 'booking:cannot_cancel',
  NOT_AUTHORIZED: 'booking:not_authorized',
  PROFESSIONAL_NOT_AVAILABLE: 'booking:professional_not_available',
  SLOT_NOT_AVAILABLE: 'booking:slot_not_available',
  EXTRA_WORK_PENDING: 'booking:extra_work_pending',
  PAYMENT_REQUIRED: 'booking:payment_required',
  ALREADY_REVIEWED: 'booking:already_reviewed',
} as const;

// ---------------------------------------------------------------------------
// Core booking interfaces
// ---------------------------------------------------------------------------

/**
 * Minimal booking shape for internal use.
 */
export interface BookingBase {
  id: string;
  customerId: string;
  professionalId: string;
  serviceId: string;
  addressId: string;
  requestId: string | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: BookingStatus;
  estimatedAmountMinor: number;
  finalAmountMinor: number | null;
  platformFeeMinor: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A status transition record.
 */
export interface BookingStatusHistoryEntry {
  id: string;
  bookingId: string;
  status: BookingStatus;
  actorType: ActorType;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * A line item for extra work.
 */
export interface BookingItem {
  id: string;
  bookingId: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  approved: boolean;
  createdAt: Date;
}

/**
 * A professional's proposal for scope expansion.
 */
export interface ExtraWorkRequest {
  id: string;
  bookingId: string;
  professionalId: string;
  description: string;
  amountMinor: number;
  evidenceUrls: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  customerResponseAt: Date | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Trust boundary shapes — customer vs professional views
// ---------------------------------------------------------------------------

/**
 * Customer's view of their booking.
 *
 * Includes full pricing, professional details, and customer-facing actions.
 */
export interface CustomerBookingView {
  id: string;
  status: BookingStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  estimatedAmountMinor: number;
  finalAmountMinor: number | null;
  notes: string | null;
  createdAt: Date;
  service: {
    id: string;
    name: string;
    categoryName: string;
  };
  professional: {
    id: string;
    businessName: string;
    rating: number | null;
    completedJobs: number;
  };
  address: {
    id: string;
    label: string;
    addressLine: string;
    locality: string;
    city: string;
  };
  extraWorkRequests: Array<{
    id: string;
    description: string;
    amountMinor: number;
    evidenceUrls: string[];
    status: string;
    createdAt: Date;
  }>;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceMinor: number;
    approved: boolean;
  }>;
  canCancel: boolean;
  canReview: boolean;
  canPayment: boolean;
}

/**
 * Professional's view of a job they're assigned to.
 *
 * Includes customer contact info (phone) and job-action capabilities.
 */
export interface ProfessionalJobView {
  id: string;
  status: BookingStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  estimatedAmountMinor: number;
  finalAmountMinor: number | null;
  notes: string | null;
  createdAt: Date;
  service: {
    id: string;
    name: string;
    categoryName: string;
  };
  customer: {
    id: string;
    name: string | null;
    phone: string;
  };
  address: {
    label: string;
    addressLine: string;
    locality: string;
    city: string;
    instructions: string | null;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceMinor: number;
    approved: boolean;
  }>;
  canAccept: boolean;
  canDecline: boolean;
  canMarkArrived: boolean;
  canStart: boolean;
  canProposeExtraWork: boolean;
  canComplete: boolean;
}
