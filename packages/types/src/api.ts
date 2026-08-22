/**
 * API transport contract.
 *
 * The error envelope matches 06_API_SPEC.md exactly. Only transport-level error
 * codes are defined here; domain codes (for example `BOOKING_NOT_AVAILABLE`)
 * are introduced by the phase that owns the corresponding domain.
 */

export const API_VERSION = 'v1';

/** Version prefix mandated by 06_API_SPEC.md. */
export const API_PREFIX = `/api/${API_VERSION}`;

/** Header used to accept or propagate a request correlation id. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Header carrying the idempotency key for booking/payment commands. */
export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  RATE_LIMITED: 'RATE_LIMITED',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_KEY_CONFLICT: 'IDEMPOTENCY_KEY_CONFLICT',
  IDEMPOTENT_REQUEST_IN_PROGRESS: 'IDEMPOTENT_REQUEST_IN_PROGRESS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Body of an error response. `code` is typed as `string` rather than
 * `ErrorCode` so that domain modules can contribute their own codes without
 * having to widen this package.
 */
export interface ApiErrorBody {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
  requestId: string;
}
