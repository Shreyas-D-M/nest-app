import { describe, expect, it } from 'vitest';
import { otpRequestSchema, otpVerifySchema, refreshSchema } from './auth';
import { updateProfileSchema } from './user';
import { createAddressSchema, updateAddressSchema } from './address';

describe('otpRequestSchema', () => {
  it('accepts and preserves standard E.164', () => {
    const parsed = otpRequestSchema.safeParse({ phone: '+919876543210' });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.phone).toBe('+919876543210');
  });

  it('normalizes 10-digit Indian numbers and formatted numbers with spaces', () => {
    const parsed10 = otpRequestSchema.safeParse({ phone: '9876543210' });
    expect(parsed10.success).toBe(true);
    expect(parsed10.success && parsed10.data.phone).toBe('+919876543210');

    const parsedSpaces = otpRequestSchema.safeParse({ phone: '+91 98765 43210' });
    expect(parsedSpaces.success).toBe(true);
    expect(parsedSpaces.success && parsedSpaces.data.phone).toBe('+919876543210');
  });

  it('strips unknown fields, so a client cannot smuggle extras', () => {
    const parsed = otpRequestSchema.safeParse({ phone: '+919876543210', role: 'ADMIN' });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual({ phone: '+919876543210' });
  });
});

describe('otpVerifySchema', () => {
  it('accepts a six-digit code', () => {
    expect(otpVerifySchema.safeParse({ phone: '+919876543210', code: '012345' }).success).toBe(
      true,
    );
  });

  it.each(['12345', '1234567', 'abcdef', '12 34 56', ''])('rejects code %j', (code) => {
    expect(otpVerifySchema.safeParse({ phone: '+919876543210', code }).success).toBe(false);
  });
});

describe('refreshSchema', () => {
  it('accepts a base64url token', () => {
    expect(refreshSchema.safeParse({ refreshToken: 'A'.repeat(64) }).success).toBe(true);
    expect(refreshSchema.safeParse({ refreshToken: `${'a-b_c'.repeat(10)}xyz` }).success).toBe(
      true,
    );
  });

  it('rejects tokens that are too short or contain non-base64url characters', () => {
    expect(refreshSchema.safeParse({ refreshToken: 'short' }).success).toBe(false);
    expect(refreshSchema.safeParse({ refreshToken: `${'A'.repeat(64)}=` }).success).toBe(false);
    expect(refreshSchema.safeParse({ refreshToken: `${'A'.repeat(64)}/x` }).success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('accepts a partial patch', () => {
    expect(updateProfileSchema.safeParse({ name: 'Asha' }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ email: 'a@example.com' }).success).toBe(true);
  });

  it('allows clearing a field with null', () => {
    expect(updateProfileSchema.safeParse({ email: null }).success).toBe(true);
  });

  it('rejects an empty patch', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });

  it('normalises email to lowercase and trims it', () => {
    const parsed = updateProfileSchema.safeParse({ email: '  Asha@Example.COM ' });

    expect(parsed.success && parsed.data.email).toBe('asha@example.com');
  });

  it('rejects a malformed email', () => {
    expect(updateProfileSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('strips role, status and phone — a user cannot promote themselves', () => {
    const parsed = updateProfileSchema.safeParse({
      name: 'Asha',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+910000000000',
    });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual({ name: 'Asha' });
  });
});

const validAddress = {
  label: 'Home',
  addressLine: '12 Camp Road',
  locality: 'Camp',
  city: 'Belagavi',
  state: 'Karnataka',
  pincode: '590001',
};

describe('createAddressSchema', () => {
  it('accepts a complete address without coordinates', () => {
    expect(createAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it('accepts coordinates supplied together', () => {
    expect(
      createAddressSchema.safeParse({ ...validAddress, latitude: 15.8497, longitude: 74.4977 })
        .success,
    ).toBe(true);
  });

  it('rejects a half-specified coordinate pair', () => {
    expect(createAddressSchema.safeParse({ ...validAddress, latitude: 15.8497 }).success).toBe(
      false,
    );
    expect(createAddressSchema.safeParse({ ...validAddress, longitude: 74.4977 }).success).toBe(
      false,
    );
  });

  it('rejects out-of-range coordinates', () => {
    expect(
      createAddressSchema.safeParse({ ...validAddress, latitude: 91, longitude: 0 }).success,
    ).toBe(false);
    expect(
      createAddressSchema.safeParse({ ...validAddress, latitude: 0, longitude: 181 }).success,
    ).toBe(false);
  });

  it('requires every mandatory field', () => {
    for (const key of Object.keys(validAddress)) {
      const partial = { ...validAddress } as Record<string, unknown>;
      delete partial[key];

      expect(createAddressSchema.safeParse(partial).success, `missing ${key}`).toBe(false);
    }
  });

  it('rejects an invalid pincode', () => {
    expect(createAddressSchema.safeParse({ ...validAddress, pincode: '059000' }).success).toBe(
      false,
    );
    expect(createAddressSchema.safeParse({ ...validAddress, pincode: '59001' }).success).toBe(
      false,
    );
  });

  it('enforces field length limits that match the column widths', () => {
    expect(createAddressSchema.safeParse({ ...validAddress, label: 'x'.repeat(41) }).success).toBe(
      false,
    );
    expect(
      createAddressSchema.safeParse({ ...validAddress, addressLine: 'x'.repeat(256) }).success,
    ).toBe(false);
    expect(
      createAddressSchema.safeParse({ ...validAddress, instructions: 'x'.repeat(501) }).success,
    ).toBe(false);
  });

  it('rejects whitespace-only required text', () => {
    expect(createAddressSchema.safeParse({ ...validAddress, label: '   ' }).success).toBe(false);
  });
});

describe('updateAddressSchema', () => {
  it('accepts a single field', () => {
    expect(updateAddressSchema.safeParse({ city: 'Hubli' }).success).toBe(true);
  });

  it('rejects an empty patch', () => {
    expect(updateAddressSchema.safeParse({}).success).toBe(false);
  });

  it('still rejects a half-specified coordinate pair', () => {
    expect(updateAddressSchema.safeParse({ latitude: 15.8497 }).success).toBe(false);
  });

  it('accepts clearing instructions', () => {
    expect(updateAddressSchema.safeParse({ instructions: null }).success).toBe(true);
  });
});
