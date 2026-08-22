import { HttpStatus } from '@nestjs/common';
import { AUTH_ERROR_CODES, ERROR_CODES } from '@nest/types';
import { ApiException } from '../../common/errors/api-exception';

/**
 * Authentication failures.
 *
 * Two rules govern the messages here:
 *
 *   1. **No account enumeration.** Nothing reveals whether a phone number is
 *      registered. Requesting a code for an unknown number behaves identically to
 *      requesting one for a known number.
 *   2. **No verification oracle.** "Wrong code" and "no such challenge" are
 *      distinguishable to a legitimate user (they need to know whether to
 *      re-request) but neither confirms anything about the account.
 */

export class OtpInvalidException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      AUTH_ERROR_CODES.OTP_INVALID,
      'That code is not correct. Check the code and try again.',
    );
  }
}

export class OtpExpiredException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      AUTH_ERROR_CODES.OTP_EXPIRED,
      'That code has expired. Request a new one.',
    );
  }
}

export class OtpMaxAttemptsException extends ApiException {
  constructor() {
    super(
      HttpStatus.TOO_MANY_REQUESTS,
      AUTH_ERROR_CODES.OTP_MAX_ATTEMPTS,
      'Too many incorrect attempts. Request a new code.',
    );
  }
}

export class AccessTokenInvalidException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      AUTH_ERROR_CODES.ACCESS_TOKEN_INVALID,
      'Authentication is required.',
    );
  }
}

export class AccessTokenExpiredException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      AUTH_ERROR_CODES.ACCESS_TOKEN_EXPIRED,
      'Your session has expired. Sign in again.',
    );
  }
}

export class RefreshTokenInvalidException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      AUTH_ERROR_CODES.REFRESH_TOKEN_INVALID,
      'Your session is no longer valid. Sign in again.',
    );
  }
}

export class AccountSuspendedException extends ApiException {
  /**
   * Used for both SUSPENDED and DELETED accounts. The two are not distinguished
   * over the wire: confirming that an account was deleted is itself information
   * about a person.
   */
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      AUTH_ERROR_CODES.ACCOUNT_SUSPENDED,
      'This account cannot be used. Contact support.',
    );
  }
}

export class RateLimitedException extends ApiException {
  constructor(retryAfterSeconds: number) {
    super(
      HttpStatus.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMITED,
      'Too many requests. Try again shortly.',
      {
        retryAfterSeconds,
      },
    );
  }
}
