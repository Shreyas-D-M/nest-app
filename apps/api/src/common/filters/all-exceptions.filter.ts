import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Response } from 'express';
import { ERROR_CODES, type ApiErrorBody, type ApiErrorResponse } from '@nest/types';
import { getRequestId } from '../request-context/request-context';
import { ApiException } from '../errors/api-exception';

/**
 * Maps HTTP statuses raised by framework-level exceptions onto NEST error codes,
 * so that a client always receives a code even when the error did not originate
 * in application code.
 */
const STATUS_TO_CODE: Readonly<Partial<Record<number, string>>> = {
  [HttpStatus.BAD_REQUEST]: ERROR_CODES.VALIDATION_FAILED,
  [HttpStatus.UNAUTHORIZED]: ERROR_CODES.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ERROR_CODES.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ERROR_CODES.NOT_FOUND,
  [HttpStatus.METHOD_NOT_ALLOWED]: ERROR_CODES.METHOD_NOT_ALLOWED,
  [HttpStatus.CONFLICT]: ERROR_CODES.CONFLICT,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ERROR_CODES.PAYLOAD_TOO_LARGE,
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
  [HttpStatus.TOO_MANY_REQUESTS]: ERROR_CODES.RATE_LIMITED,
  [HttpStatus.SERVICE_UNAVAILABLE]: ERROR_CODES.SERVICE_UNAVAILABLE,
};

/** Returned for any unrecognised failure. Never echoes internal detail. */
const GENERIC_SERVER_MESSAGE = 'An unexpected error occurred. Please try again.';

interface ResolvedError {
  status: number;
  body: ApiErrorBody;
}

/**
 * Converts every thrown value into the single error envelope defined in
 * 06_API_SPEC.md:
 *
 *   { "error": { "code", "message", "details" }, "requestId" }
 *
 * Two rules drive the implementation:
 *   1. A 5xx never leaks internal detail to the client — the stack trace goes to
 *      the logs, a generic message goes over the wire.
 *   2. Every response carries the request id, so a user-reported failure can be
 *      traced to a log line.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = getRequestId() ?? '';
    const { status, body } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({ err: exception, requestId, status }, 'Unhandled server error');
    } else {
      this.logger.warn({ requestId, status, code: body.code }, 'Request failed');
    }

    const payload: ApiErrorResponse = { error: body, requestId };

    response.status(status).json(payload);
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof ApiException) {
      return { status: exception.getStatus(), body: exception.errorBody };
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: GENERIC_SERVER_MESSAGE,
        details: {},
      },
    };
  }

  private fromHttpException(exception: HttpException): ResolvedError {
    const status = exception.getStatus();
    const code = STATUS_TO_CODE[status] ?? ERROR_CODES.INTERNAL_ERROR;

    // A 5xx raised as an HttpException is still a server fault; suppress its
    // message for the same reason as an unknown throw.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return {
        status,
        body: { code, message: GENERIC_SERVER_MESSAGE, details: {} },
      };
    }

    return {
      status,
      body: { code, message: extractMessage(exception), details: {} },
    };
  }
}

function extractMessage(exception: HttpException): string {
  const response: unknown = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (typeof response === 'object' && response !== null && 'message' in response) {
    const { message } = response as { message: unknown };

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.filter((entry): entry is string => typeof entry === 'string').join('; ');
    }
  }

  return exception.message;
}
