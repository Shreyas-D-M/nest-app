import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODES, type ApiErrorBody } from '@nest/types';

/**
 * Base class for errors that carry a stable machine-readable code.
 *
 * The `code` is part of the API contract (06_API_SPEC.md) — clients branch on
 * it, so it must not change when wording changes. `message` is human-facing and
 * safe to show; anything sensitive belongs in the logs, not here.
 */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    const body: ApiErrorBody = { code, message, details };
    super(body, status);
  }

  get errorBody(): ApiErrorBody {
    return { code: this.code, message: this.message, details: this.details };
  }
}

export class ValidationFailedException extends ApiException {
  constructor(details: Record<string, unknown> = {}) {
    super(
      HttpStatus.BAD_REQUEST,
      ERROR_CODES.VALIDATION_FAILED,
      'The request failed validation.',
      details,
    );
  }
}

export class ResourceNotFoundException extends ApiException {
  constructor(message = 'The requested resource was not found.') {
    super(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, message);
  }
}
