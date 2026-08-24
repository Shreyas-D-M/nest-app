import { z } from 'zod';
import { VERIFICATION_STATUSES } from '@nest/types';
import { boundedTextSchema, uuidSchema } from './primitives';
import { minorUnitsSchema } from './money';
import { pricingTypeSchema } from './professional';

/**
 * Admin request schemas.
 *
 * Service creation and updates are admin-only, matching 06_API_SPEC.md — a
 * professional chooses which services to offer and at what price, but not what
 * services exist.
 */

export const verificationStatusSchema = z.enum(VERIFICATION_STATUSES);

/** `POST /admin/services`. */
export const adminCreateServiceSchema = z.object({
  categoryId: uuidSchema,
  name: boundedTextSchema(2, 120),
  /** URL-safe identifier. Lowercase and hyphenated so links stay predictable. */
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase words separated by hyphens'),
  description: boundedTextSchema(1, 1000).nullable().optional(),
  pricingType: pricingTypeSchema,
  /** Indicative starting price in integer paise. Null when there is none. */
  basePriceMinor: minorUnitsSchema.nullable().optional(),
  active: z.boolean().optional(),
});

export type AdminCreateServiceInput = z.infer<typeof adminCreateServiceSchema>;

/**
 * `PATCH /admin/services/:id`.
 *
 * The slug is deliberately immutable: it appears in URLs, and silently changing
 * it would break every existing link.
 */
export const adminUpdateServiceSchema = z
  .object({
    categoryId: uuidSchema.optional(),
    name: boundedTextSchema(2, 120).optional(),
    description: boundedTextSchema(1, 1000).nullable().optional(),
    pricingType: pricingTypeSchema.optional(),
    basePriceMinor: minorUnitsSchema.nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export type AdminUpdateServiceInput = z.infer<typeof adminUpdateServiceSchema>;

/**
 * `POST /admin/professionals/:id/reject` and `.../request-changes`.
 *
 * A reason is mandatory. Rejecting a person's livelihood application without
 * telling them why is not an acceptable outcome, and the professional is shown
 * this text.
 */
export const adminReviewDecisionSchema = z.object({
  reason: boundedTextSchema(10, 1000),
});

export type AdminReviewDecisionInput = z.infer<typeof adminReviewDecisionSchema>;

/**
 * `POST /admin/professionals/:id/approve`.
 *
 * Notes are optional here — approval needs no justification to the applicant.
 */
export const adminApprovalSchema = z.object({
  notes: boundedTextSchema(1, 1000).nullable().optional(),
});

export type AdminApprovalInput = z.infer<typeof adminApprovalSchema>;

/** Offset pagination for admin list endpoints. */
export const adminListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AdminListQueryInput = z.infer<typeof adminListQuerySchema>;

/** `GET /admin/professionals` — optionally filtered by verification state. */
export const adminProfessionalListQuerySchema = adminListQuerySchema.extend({
  verificationStatus: verificationStatusSchema.optional(),
});

export type AdminProfessionalListQueryInput = z.infer<typeof adminProfessionalListQuerySchema>;

/** `GET /admin/audit-logs` — optionally filtered by entity or actor. */
export const adminAuditLogQuerySchema = adminListQuerySchema.extend({
  entityType: boundedTextSchema(1, 60).optional(),
  entityId: boundedTextSchema(1, 64).optional(),
  actorId: uuidSchema.optional(),
});

export type AdminAuditLogQueryInput = z.infer<typeof adminAuditLogQuerySchema>;
