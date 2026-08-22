import { describe, expect, it } from 'vitest';
import { minorUnitsSchema, moneySchema } from './money';
import { e164PhoneSchema, indianPincodeSchema } from './primitives';
import { booleanFromEnvSchema, portSchema, postgresUrlSchema } from './env';

describe('money', () => {
  it('accepts integer minor units', () => {
    expect(minorUnitsSchema.safeParse(125050).success).toBe(true);
    expect(minorUnitsSchema.safeParse(0).success).toBe(true);
  });

  it('rejects decimal amounts rather than rounding them', () => {
    expect(minorUnitsSchema.safeParse(1250.5).success).toBe(false);
  });

  it('rejects negative amounts', () => {
    expect(minorUnitsSchema.safeParse(-1).success).toBe(false);
  });

  it('requires a supported currency', () => {
    expect(moneySchema.safeParse({ amountMinor: 100, currency: 'INR' }).success).toBe(true);
    expect(moneySchema.safeParse({ amountMinor: 100, currency: 'USD' }).success).toBe(false);
  });
});

describe('phone', () => {
  it('accepts E.164', () => {
    expect(e164PhoneSchema.safeParse('+919876543210').success).toBe(true);
  });

  it('rejects local formatting', () => {
    expect(e164PhoneSchema.safeParse('9876543210').success).toBe(false);
    expect(e164PhoneSchema.safeParse('+91 98765 43210').success).toBe(false);
  });
});

describe('pincode', () => {
  it('accepts a six-digit code', () => {
    expect(indianPincodeSchema.safeParse('590001').success).toBe(true);
  });

  it('rejects a leading zero and wrong lengths', () => {
    expect(indianPincodeSchema.safeParse('059000').success).toBe(false);
    expect(indianPincodeSchema.safeParse('59001').success).toBe(false);
  });
});

describe('env schemas', () => {
  it('coerces ports from strings', () => {
    const parsed = portSchema.safeParse('3000');
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toBe(3000);
  });

  it('rejects out-of-range ports', () => {
    expect(portSchema.safeParse('70000').success).toBe(false);
  });

  it('parses shell booleans', () => {
    expect(booleanFromEnvSchema.parse('true')).toBe(true);
    expect(booleanFromEnvSchema.parse('1')).toBe(true);
    expect(booleanFromEnvSchema.parse('false')).toBe(false);
    expect(booleanFromEnvSchema.parse('0')).toBe(false);
  });

  it('requires a postgres scheme for the database url', () => {
    expect(postgresUrlSchema.safeParse('postgresql://user:pw@localhost:5432/nest').success).toBe(
      true,
    );
    expect(postgresUrlSchema.safeParse('mysql://localhost/nest').success).toBe(false);
  });
});
