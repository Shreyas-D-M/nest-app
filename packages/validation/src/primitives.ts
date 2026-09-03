import { z } from 'zod';
import { normalizePhoneNumber } from '@nest/types';

export { normalizePhoneNumber };

export const uuidSchema = z.string().uuid();

/** ISO-8601 timestamp. Stored and transported in UTC. */
export const isoTimestampSchema = z.string().datetime({ offset: true });

/**
 * E.164 phone number, e.g. +919876543210.
 *
 * Preprocessed with normalizePhoneNumber so that local Indian formats (10-digit,
 * formatted with spaces/dashes, or leading zero) canonicalize to +91XXXXXXXXXX.
 */
export const e164PhoneSchema = z.preprocess(
  normalizePhoneNumber,
  z.string().regex(/^\+[1-9]\d{7,14}$/, 'Phone number must be in E.164 format, e.g. +919876543210'),
);

/** Indian PIN code — six digits, never starting with zero. */
export const indianPincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, 'PIN code must be six digits');

/** Latitude in decimal degrees. */
export const latitudeSchema = z.number().min(-90).max(90);

/** Longitude in decimal degrees. */
export const longitudeSchema = z.number().min(-180).max(180);

/** Non-empty, trimmed, length-bounded free text. */
export const boundedTextSchema = (min: number, max: number) => z.string().trim().min(min).max(max);
