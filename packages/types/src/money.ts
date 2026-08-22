import type { Brand } from './primitives';

/**
 * Monetary representation.
 *
 * CLAUDE.md and 05_DATABASE.md both require integer minor units — never
 * floating point. For INR the minor unit is the paise, so ₹1,250.50 is
 * represented as `125050`.
 *
 * Arithmetic on money is deliberately NOT defined here: pricing is a
 * server-authoritative concern and belongs in the API's domain layer, so that
 * no client can derive or override an amount.
 */

export const SUPPORTED_CURRENCIES = ['INR'] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

/** An integer count of a currency's minor unit (paise for INR). */
export type MinorUnits = Brand<number, 'MinorUnits'>;

export interface Money {
  readonly amountMinor: MinorUnits;
  readonly currency: Currency;
}

/** Number of minor units in one major unit, per currency. */
export const MINOR_UNITS_PER_MAJOR: Readonly<Record<Currency, number>> = {
  INR: 100,
};
