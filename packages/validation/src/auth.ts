import { z } from 'zod';
import { OTP_CODE_LENGTH } from '@nest/types';
import { e164PhoneSchema } from './primitives';

/**
 * Authentication request schemas.
 *
 * Shared by the API and by the client apps, so a form and its endpoint cannot
 * disagree about what is valid.
 */

export const otpRequestSchema = z.object({
  phone: e164PhoneSchema,
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpCodeSchema = z
  .string()
  .regex(new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`), `Code must be ${OTP_CODE_LENGTH} digits`);

export const otpVerifySchema = z.object({
  phone: e164PhoneSchema,
  code: otpCodeSchema,
});

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

/**
 * Refresh tokens are opaque, URL-safe, and fixed length by construction. The
 * bounds reject obvious junk before a database lookup is attempted.
 */
export const refreshTokenSchema = z
  .string()
  .min(32)
  .max(512)
  .regex(/^[A-Za-z0-9_-]+$/, 'Malformed refresh token');

export const refreshSchema = z.object({
  refreshToken: refreshTokenSchema,
});

export type RefreshInput = z.infer<typeof refreshSchema>;

export const logoutSchema = z.object({
  refreshToken: refreshTokenSchema,
});

export type LogoutInput = z.infer<typeof logoutSchema>;
