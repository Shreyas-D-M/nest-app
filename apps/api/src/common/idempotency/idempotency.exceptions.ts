import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '@nest/types';
import { ApiException } from '../errors/api-exception';

/**
 * The same key was replayed with a different payload.
 *
 * This is a client bug and must never be treated as a successful replay:
 * returning the first response would tell the caller that a *different* command
 * succeeded.
 */
export class IdempotencyKeyConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      ERROR_CODES.IDEMPOTENCY_KEY_CONFLICT,
      'This idempotency key was already used with a different request payload.',
    );
  }
}

/**
 * An identical request is still executing.
 *
 * Returning a duplicate result is not an option, and neither is running the
 * command twice, so the caller is told to retry.
 */
export class IdempotentRequestInProgressException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      ERROR_CODES.IDEMPOTENT_REQUEST_IN_PROGRESS,
      'An identical request is currently being processed. Please retry shortly.',
    );
  }
}
