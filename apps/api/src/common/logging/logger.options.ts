import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Params } from 'nestjs-pino';
import { API_PREFIX } from '@nest/types';
import type { AppConfigService } from '../../config/app-config.service';
import { getRequestId } from '../request-context/request-context';

/**
 * Structured logging configuration.
 *
 * 07_ARCHITECTURE.md calls for structured logs with request ids. Every line is
 * JSON in staging and production so it can be queried; development uses a
 * human-readable renderer.
 *
 * Redaction is not optional. Authorisation headers and cookies would otherwise
 * be captured verbatim on every request, turning the log store into a
 * credential store — and PII minimisation is a stated requirement.
 */
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.headers["idempotency-key"]',
  'res.headers["set-cookie"]',
];

/** Liveness is polled continuously by the platform; logging it is pure noise. */
function isHealthProbe(req: IncomingMessage): boolean {
  return req.url === `${API_PREFIX}/health`;
}

export function buildLoggerParams(config: AppConfigService): Params {
  return {
    pinoHttp: {
      // Tests run silent so that failures are readable.
      level: config.isTest ? 'silent' : config.logLevel,

      // Reuse the id established by the request-context middleware so that the
      // HTTP log line, application logs and the error envelope all agree.
      genReqId: (): string => getRequestId() ?? randomUUID(),

      customProps: (): Record<string, string | undefined> => ({
        requestId: getRequestId(),
      }),

      redact: {
        paths: REDACTED_PATHS,
        censor: '[redacted]',
      },

      autoLogging: {
        ignore: isHealthProbe,
      },

      transport: config.isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
    },
  };
}
