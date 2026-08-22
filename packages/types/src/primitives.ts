/**
 * Branded primitive types.
 *
 * Branding keeps identifiers and encoded values from being silently
 * interchanged with plain `string` / `number` — for example, passing a raw
 * rupee amount where integer paise are required.
 */

declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };

/** A UUID used as a public-facing identifier (see 05_DATABASE.md). */
export type Uuid = Brand<string, 'Uuid'>;

/**
 * An ISO-8601 timestamp in UTC.
 *
 * All timestamps are stored and transported in UTC; localisation to the user's
 * timezone happens at render time only (05_DATABASE.md).
 */
export type IsoTimestamp = Brand<string, 'IsoTimestamp'>;

/** Correlation identifier attached to every API request and log line. */
export type RequestId = Brand<string, 'RequestId'>;

/** Deployment environment. */
export const ENVIRONMENTS = ['development', 'staging', 'production', 'test'] as const;

export type Environment = (typeof ENVIRONMENTS)[number];
