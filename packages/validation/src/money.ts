import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '@nest/types';

/**
 * Money schemas.
 *
 * Amounts are always integer minor units (paise). A non-integer amount is a
 * validation failure, not something to round — silent rounding is how money
 * bugs reach production.
 */

export const minorUnitsSchema = z
  .number()
  .int('Monetary amounts must be integer minor units (paise), not decimals')
  .nonnegative();

export const currencySchema = z.enum(SUPPORTED_CURRENCIES);

export const moneySchema = z.object({
  amountMinor: minorUnitsSchema,
  currency: currencySchema,
});

export type MoneyInput = z.infer<typeof moneySchema>;
