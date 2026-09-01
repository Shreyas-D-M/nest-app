/**
 * Payment types, enums, and error codes.
 *
 * Covers payment processing, provider integration, and payment lifecycle.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const PAYMENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ['stub', 'razorpay'] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export const PAYMENT_ERROR_CODES = {
  NOT_FOUND: 'payment:not_found',
  ALREADY_EXISTS: 'payment:already_exists',
  INVALID_AMOUNT: 'payment:invalid_amount',
  PROVIDER_ERROR: 'payment:provider_error',
  VERIFICATION_FAILED: 'payment:verification_failed',
  ALREADY_PAID: 'payment:already_paid',
  CANNOT_REFUND: 'payment:cannot_refund',
  BOOKING_NOT_READY: 'payment:booking_not_ready',
} as const;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * A payment record for one booking.
 */
export interface Payment {
  id: string;
  bookingId: string;
  provider: string;
  providerPaymentId: string | null;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of initiating a payment with a provider.
 */
export interface PaymentInitiationResult {
  paymentId: string;
  providerPaymentId: string;
  checkoutUrl: string;
  amountMinor: number;
  currency: string;
}

/**
 * Result of verifying a payment with the provider.
 */
export interface PaymentVerification {
  status: PaymentStatus;
  paidAt: Date | null;
  providerPaymentId: string;
}

/**
 * Customer's view of payment for a booking.
 */
export interface CustomerPaymentView {
  id: string;
  bookingId: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  paidAt: Date | null;
  /** Checkout URL for customer to complete payment (only when status is PENDING). */
  checkoutUrl: string | null;
}
