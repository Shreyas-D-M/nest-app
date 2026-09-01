import { z } from 'zod';
import { BOOKING_STATUSES } from '@nest/types';
import { boundedTextSchema, uuidSchema } from './primitives';
import { minorUnitsSchema } from './money';

/**
 * Booking validation schemas.
 *
 * Field lengths mirror database column widths, so a value that validates
 * cannot then fail on insert.
 */

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);

/**
 * `POST /bookings` — create a new booking.
 *
 * The server calculates the estimated amount from the service and professional's
 * pricing, so the client does not supply it. Scheduled times must be in the
 * future and end must be after start.
 */
export const bookingCreateSchema = z
  .object({
    serviceId: uuidSchema,
    professionalId: uuidSchema,
    addressId: uuidSchema,
    scheduledStart: z.string().datetime({ offset: true }),
    scheduledEnd: z.string().datetime({ offset: true }),
    notes: boundedTextSchema(1, 2000).nullable().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.scheduledStart);
      const end = new Date(data.scheduledEnd);
      return end > start;
    },
    { message: 'scheduledEnd must be after scheduledStart' },
  );

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

/**
 * `POST /bookings/:id/cancel` — cancel a booking.
 *
 * Reason is mandatory: cancellations feed into professional reliability metrics
 * and dispute resolution, so "why" must be recorded.
 */
export const bookingCancelSchema = z.object({
  reason: boundedTextSchema(10, 500),
});

export type BookingCancelInput = z.infer<typeof bookingCancelSchema>;

/**
 * `POST /bookings/:id/confirm-extra-work` and `/reject-extra-work`.
 *
 * Customer's response to a professional's extra work proposal.
 */
export const extraWorkApprovalSchema = z.object({
  approved: z.boolean(),
  /** Optional reason when rejecting. */
  reason: boundedTextSchema(10, 500).optional(),
});

export type ExtraWorkApprovalInput = z.infer<typeof extraWorkApprovalSchema>;

/**
 * `POST /bookings/:id/review` — submit a review after job completion.
 *
 * Rating is 1-5 stars. Comment is bounded to prevent abuse. Tags are predefined
 * categories (e.g., "punctual", "professional", "quality work").
 */
export const bookingReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: boundedTextSchema(10, 2000),
  tags: z.array(z.string().min(1).max(50)).max(5).optional(),
});

export type BookingReviewInput = z.infer<typeof bookingReviewSchema>;

/**
 * `GET /bookings` — list customer's bookings with filters.
 */
export const bookingListQuerySchema = z.object({
  status: bookingStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type BookingListQueryInput = z.infer<typeof bookingListQuerySchema>;

/**
 * `GET /professional/jobs` — list professional's assigned jobs.
 */
export const professionalJobListQuerySchema = z.object({
  status: bookingStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ProfessionalJobListQueryInput = z.infer<typeof professionalJobListQuerySchema>;

/**
 * `POST /professional/jobs/:id/accept` — accept a job.
 *
 * Optional estimated arrival time for customer notification.
 */
export const professionalJobAcceptSchema = z.object({
  estimatedArrivalMinutes: z.number().int().min(5).max(180).optional(),
});

export type ProfessionalJobAcceptInput = z.infer<typeof professionalJobAcceptSchema>;

/**
 * `POST /professional/jobs/:id/decline` — decline a job.
 *
 * Reason is mandatory for reliability tracking.
 */
export const professionalJobDeclineSchema = z.object({
  reason: boundedTextSchema(10, 500),
});

export type ProfessionalJobDeclineInput = z.infer<typeof professionalJobDeclineSchema>;

/**
 * `POST /professional/jobs/:id/extra-work` — propose extra work.
 *
 * Description explains what additional work is needed. Amount is incremental
 * cost in paise. Evidence URLs are storage keys for photos documenting the need.
 */
export const professionalExtraWorkSchema = z.object({
  description: boundedTextSchema(20, 2000),
  amountMinor: minorUnitsSchema,
  evidenceUrls: z.array(z.string().url()).min(1).max(10),
});

export type ProfessionalExtraWorkInput = z.infer<typeof professionalExtraWorkSchema>;

/**
 * Generic action schema for simple professional job state transitions.
 *
 * Used by `/arrived`, `/start`, `/complete` endpoints that take no body.
 */
export const professionalJobActionSchema = z.object({});

export type ProfessionalJobActionInput = z.infer<typeof professionalJobActionSchema>;
