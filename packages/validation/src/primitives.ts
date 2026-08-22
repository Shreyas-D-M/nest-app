import { z } from 'zod';

/**
 * Reusable primitive schemas.
 *
 * Every schema here is shared by the API and by client forms so that a single
 * definition governs both sides of the wire (CLAUDE.md: no duplicate business
 * logic, validate all external input).
 */

export const uuidSchema = z.string().uuid();

/** ISO-8601 timestamp. Stored and transported in UTC. */
export const isoTimestampSchema = z.string().datetime({ offset: true });

/**
 * E.164 phone number, e.g. +919876543210.
 *
 * Stored in E.164 so that the same identity resolves regardless of how the user
 * typed it. Country-specific input formatting is a UI concern.
 */
export const e164PhoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone number must be in E.164 format, e.g. +919876543210');

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
