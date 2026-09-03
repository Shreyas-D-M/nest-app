import type { RateLimit } from '../../common/rate-limit/rate-limiter.service';

/**
 * Rate limits for authentication endpoints, required by 06_API_SPEC.md.
 *
 * These are constants rather than environment variables to keep the
 * configuration surface small. They are security parameters, not per-deployment
 * tuning knobs; changing one should be a reviewed code change.
 *
 * Two dimensions are limited independently, because each stops a different abuse:
 *   * per phone number — protects the person receiving the SMS from being
 *     spammed, and protects us from the cost of sending them.
 *   * per client IP — stops one caller cycling through many phone numbers.
 */

/** Minimum gap between two code requests for the same number. */
export const OTP_REQUEST_COOLDOWN: RateLimit = { limit: 1, windowSeconds: 60 };

/** Codes per number per hour in production. */
export const OTP_REQUEST_PER_PHONE: RateLimit = { limit: 5, windowSeconds: 3600 };

/** Codes per number per hour in dev/test — allows local dev cycles while 60s cooldown is the active gate. */
export const OTP_REQUEST_PER_PHONE_DEV: RateLimit = { limit: 100, windowSeconds: 3600 };

/** Code requests per IP per hour, across all numbers. */
export const OTP_REQUEST_PER_IP: RateLimit = { limit: 20, windowSeconds: 3600 };

/** Code requests per IP per hour in dev/test. */
export const OTP_REQUEST_PER_IP_DEV: RateLimit = { limit: 200, windowSeconds: 3600 };

/**
 * Verification attempts per IP per hour.
 *
 * Per-challenge guessing is already capped by OTP_MAX_ATTEMPTS in the database;
 * this bounds an attacker spreading guesses across many numbers.
 */
export const OTP_VERIFY_PER_IP: RateLimit = { limit: 30, windowSeconds: 3600 };

/** Refreshes per IP per hour. Generous — legitimate clients refresh often. */
export const REFRESH_PER_IP: RateLimit = { limit: 120, windowSeconds: 3600 };
