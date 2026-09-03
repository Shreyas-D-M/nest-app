import type { CurrentUser } from './user';

/**
 * Authentication contracts.
 *
 * Phone OTP is owned by the NEST API, matching the endpoints defined in
 * 06_API_SPEC.md. Firebase is reserved for social sign-in (`/auth/social`), which
 * is deferred to a later phase — nothing here depends on it.
 *
 * NEST is the session and authorization authority in every case: these tokens are
 * issued and validated by the API, never by an external identity provider.
 */

/** Header carrying the access token. */
export const AUTHORIZATION_HEADER = 'authorization';

export const BEARER_PREFIX = 'Bearer';

/** Length of the numeric OTP code. */
export const OTP_CODE_LENGTH = 6;

/**
 * Normalizes phone numbers to canonical E.164 representation (+919876543210 for India).
 *
 * Handles:
 * - "+919876543210" -> "+919876543210"
 * - "+91 98765 43210" / "+91 9876543210" -> "+919876543210"
 * - "9876543210" -> "+919876543210"
 * - "09876543210" -> "+919876543210"
 * - "919876543210" -> "+919876543210"
 * - Non-Indian E.164 numbers (e.g. "+1 415 555 2671") -> "+14155552671"
 */
export function normalizePhoneNumber(raw: unknown): string {
  if (typeof raw !== 'string') {
    return '';
  }

  const trimmed = raw.trim();
  const cleaned = trimmed.replace(/[\s\-().]/g, '');

  if (!cleaned) {
    return cleaned;
  }

  // 10 digits without country code -> canonical Indian mobile (+91)
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // 11 digits starting with 0 -> strip leading 0 and prefix +91
  if (/^0\d{10}$/.test(cleaned)) {
    return `+91${cleaned.slice(1)}`;
  }

  // 12 digits starting with 91 -> prefix +
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Already prefixed with + (e.g. +919876543210 or international numbers)
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Domain error codes for authentication.
 *
 * Kept separate from the transport codes in `api.ts`, which stay domain-agnostic.
 */
export const AUTH_ERROR_CODES = {
  /** The submitted code did not match. */
  OTP_INVALID: 'OTP_INVALID',
  /** No live challenge exists for this phone number, or it has expired. */
  OTP_EXPIRED: 'OTP_EXPIRED',
  /** Too many wrong guesses; the challenge is burned. */
  OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS',
  /** Access token missing, malformed, or signed by something else. */
  ACCESS_TOKEN_INVALID: 'ACCESS_TOKEN_INVALID',
  /** Access token was valid but has expired; refresh it. */
  ACCESS_TOKEN_EXPIRED: 'ACCESS_TOKEN_EXPIRED',
  /** Refresh token unknown, expired, or already rotated. */
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  /** The account exists but may not be used. */
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  /** SMS delivery is not configured on this deployment. */
  SMS_NOT_CONFIGURED: 'SMS_NOT_CONFIGURED',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

/**
 * Result of requesting a code.
 *
 * Deliberately reveals nothing about whether the phone number is already
 * registered: that would turn the endpoint into an account-enumeration oracle.
 */
export interface OtpRequestResult {
  /** Seconds until the issued challenge expires. */
  expiresInSeconds: number;
  /** Seconds the client should wait before requesting another code. */
  retryAfterSeconds: number;
  /** Plaintext code returned ONLY during local development and testing. Never returned in production. */
  devOtp?: string;
}

export interface AuthTokens {
  tokenType: typeof BEARER_PREFIX;
  accessToken: string;
  /** Seconds until `accessToken` expires. */
  expiresInSeconds: number;
  refreshToken: string;
  /** Seconds until `refreshToken` expires. */
  refreshExpiresInSeconds: number;
}

/** Returned by OTP verification and by refresh. */
export interface AuthSession {
  tokens: AuthTokens;
  user: CurrentUser;
}

/**
 * Access-token claims.
 *
 * `sid` ties the access token to the session that minted it, so revoking a
 * session can be reasoned about. Role is included for cheap coarse checks, but
 * authorization always re-reads the user, because a role or status change must
 * take effect immediately rather than at token expiry.
 */
export interface AccessTokenClaims {
  /** Subject — the user id. */
  sub: string;
  /** Session id. */
  sid: string;
  /** Issued-at, seconds since epoch. */
  iat?: number;
  /** Expiry, seconds since epoch. */
  exp?: number;
}
