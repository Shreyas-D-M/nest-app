import { z } from 'zod';
import { DOCUMENT_TYPES, MINUTES_PER_DAY, ONLINE_STATUSES, PRICING_TYPES } from '@nest/types';
import { boundedTextSchema, indianPincodeSchema, uuidSchema } from './primitives';
import { minorUnitsSchema } from './money';

/**
 * Professional onboarding and profile schemas.
 *
 * Field lengths mirror the database column widths, so a value that validates
 * cannot then fail on insert.
 */

export const pricingTypeSchema = z.enum(PRICING_TYPES);

export const onlineStatusSchema = z.enum(ONLINE_STATUSES);

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);

export const weekdaySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);

/** Minutes from local midnight. */
const minuteOfDaySchema = z.number().int().min(0).max(MINUTES_PER_DAY);

export const serviceAreaSchema = z.object({
  locality: boundedTextSchema(1, 120),
  pincode: indianPincodeSchema,
});

/**
 * One weekly working window.
 *
 * The end is exclusive and must be strictly later than the start: a zero-length
 * or inverted window is meaningless and would silently make a professional
 * unbookable.
 */
export const availabilityWindowSchema = z
  .object({
    weekday: weekdaySchema,
    startMinute: minuteOfDaySchema,
    endMinute: minuteOfDaySchema,
  })
  .refine((window) => window.endMinute > window.startMinute, {
    message: 'endMinute must be later than startMinute',
  });

/**
 * A professional's price for one service.
 *
 * An ESTIMATE still carries a starting figure — customers need something to
 * compare — but 02_PRD.md makes clear it is indicative, not a quote.
 */
export const professionalServiceSchema = z.object({
  serviceId: uuidSchema,
  pricingType: pricingTypeSchema,
  basePriceMinor: minorUnitsSchema,
});

const MAX_SERVICES = 50;
const MAX_SERVICE_AREAS = 50;
const MAX_AVAILABILITY_WINDOWS = 7 * 6;

/**
 * `POST /professional/onboarding`.
 *
 * Service areas are collected here because 06_API_SPEC.md defines no dedicated
 * service-area endpoint; 03_USER_FLOWS.md places them within onboarding.
 */
export const professionalOnboardingSchema = z.object({
  businessName: boundedTextSchema(2, 120),
  bio: boundedTextSchema(1, 1000).nullable().optional(),
  yearsExperience: z.number().int().min(0).max(80),
  serviceAreas: z.array(serviceAreaSchema).min(1).max(MAX_SERVICE_AREAS),
});

export type ProfessionalOnboardingInput = z.infer<typeof professionalOnboardingSchema>;

/**
 * `PATCH /professional/profile`.
 *
 * Verification status is absent by design: a professional must never be able to
 * approve themselves. Service areas are editable here for the same reason they
 * are collected at onboarding — there is no separate documented endpoint.
 */
export const professionalProfileUpdateSchema = z
  .object({
    businessName: boundedTextSchema(2, 120).optional(),
    bio: boundedTextSchema(1, 1000).nullable().optional(),
    yearsExperience: z.number().int().min(0).max(80).optional(),
    serviceAreas: z.array(serviceAreaSchema).min(1).max(MAX_SERVICE_AREAS).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export type ProfessionalProfileUpdateInput = z.infer<typeof professionalProfileUpdateSchema>;

/**
 * `PUT /professional/services` — a full replacement, as PUT implies.
 *
 * An empty array is permitted: a professional may withdraw every service without
 * deleting their account.
 */
export const professionalServicesUpdateSchema = z.object({
  services: z
    .array(professionalServiceSchema)
    .max(MAX_SERVICES)
    .refine(
      (services) => new Set(services.map((service) => service.serviceId)).size === services.length,
      { message: 'A service may only be listed once' },
    ),
});

export type ProfessionalServicesUpdateInput = z.infer<typeof professionalServicesUpdateSchema>;

/**
 * `PUT /professional/availability` — a full replacement.
 *
 * Overlapping windows on the same weekday are rejected: two overlapping windows
 * are ambiguous about what the professional actually meant.
 */
export const professionalAvailabilityUpdateSchema = z.object({
  windows: z
    .array(availabilityWindowSchema)
    .max(MAX_AVAILABILITY_WINDOWS)
    .refine((windows) => !hasOverlap(windows), {
      message: 'Availability windows on the same day must not overlap',
    }),
});

export type ProfessionalAvailabilityUpdateInput = z.infer<
  typeof professionalAvailabilityUpdateSchema
>;

function hasOverlap(
  windows: readonly { weekday: number; startMinute: number; endMinute: number }[],
): boolean {
  const byWeekday = new Map<number, { startMinute: number; endMinute: number }[]>();

  for (const window of windows) {
    const existing = byWeekday.get(window.weekday) ?? [];
    existing.push(window);
    byWeekday.set(window.weekday, existing);
  }

  for (const dayWindows of byWeekday.values()) {
    const sorted = [...dayWindows].sort((a, b) => a.startMinute - b.startMinute);

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];

      if (previous === undefined || current === undefined) {
        continue;
      }

      if (current.startMinute < previous.endMinute) {
        return true;
      }
    }
  }

  return false;
}

/** `POST /professional/status`. */
export const professionalStatusSchema = z.object({
  onlineStatus: onlineStatusSchema,
});

export type ProfessionalStatusInput = z.infer<typeof professionalStatusSchema>;

/**
 * `POST /professional/documents` — metadata accompanying an upload.
 *
 * The file itself arrives as multipart content; only its description is validated
 * here.
 */
export const professionalDocumentSchema = z.object({
  documentType: documentTypeSchema,
  /** Optional lapse date for documents that expire, such as a licence. */
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export type ProfessionalDocumentInput = z.infer<typeof professionalDocumentSchema>;
