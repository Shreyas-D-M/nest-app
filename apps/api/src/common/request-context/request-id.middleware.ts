import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '@nest/types';
import { requestContextStorage } from './request-context';

/**
 * A client-supplied request id is only reused when it matches this pattern.
 *
 * The value is echoed in a response header and written into every log line, so
 * an unvalidated one would let a caller inject newlines or control characters
 * into the logs and forge log entries. Anything unexpected is replaced with a
 * server-generated UUID rather than sanitised in place.
 */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{8,128}$/;

export function resolveRequestId(headerValue: string | string[] | undefined): string {
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (candidate !== undefined && SAFE_REQUEST_ID.test(candidate)) {
    return candidate;
  }

  return randomUUID();
}

/**
 * Establishes the request context.
 *
 * Registered with `app.use()` during bootstrap so that it runs before any
 * module-scoped middleware — including the HTTP logger, which reads the id from
 * this store.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);

  res.setHeader(REQUEST_ID_HEADER, requestId);

  requestContextStorage.run({ requestId }, () => {
    next();
  });
}
