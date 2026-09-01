import { z } from 'zod';
import { PAYMENT_STATUSES } from '@nest/types';
import { uuidSchema } from './primitives';

/**
 * Payment validation schemas.
 *
 * Field lengths mirror database column widths.
 */

export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);

/**
 * `POST /bookings/:id/payment` — initiate payment for a booking.
 *
 * The booking ID is in the URL path. Idempotency key is optional but strongly
 * recommended to prevent duplicate payment initiation on retry.
 */
export const paymentInitiationSchema = z.object({
  /** Optional idempotency key for duplicate prevention. */
  idempotencyKey: z.string().min(1).max(128).optional(),
});

export type PaymentInitiationInput = z.infer<typeof paymentInitiationSchema>;

/**
 * `GET /admin/payments` — list payments with filters.
 */
export const paymentListQuerySchema = z.object({
  status: paymentStatusSchema.optional(),
  bookingId: uuidSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PaymentListQueryInput = z.infer<typeof paymentListQuerySchema>;
