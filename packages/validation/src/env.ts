import { z } from 'zod';
import { ENVIRONMENTS } from '@nest/types';

/**
 * Environment-variable schemas.
 *
 * Environment variables arrive as strings, so these schemas coerce and then
 * validate. The API fails fast at boot if any required variable is missing or
 * malformed, which is preferable to discovering it on the first request.
 *
 * No default values are provided for secrets or connection strings — a missing
 * secret must be an error, never a silent fallback.
 */

export const environmentSchema = z.enum(ENVIRONMENTS);

export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export const logLevelSchema = z.enum(LOG_LEVELS);

export const portSchema = z.coerce.number().int().min(1).max(65535);

/** Accepts the usual truthy/falsy spellings used in shell environments. */
export const booleanFromEnvSchema = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

export const postgresUrlSchema = z
  .string()
  .min(1)
  .refine(
    (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'DATABASE_URL must be a postgres:// or postgresql:// connection string',
  );

export const redisUrlSchema = z
  .string()
  .min(1)
  .refine(
    (value) => value.startsWith('redis://') || value.startsWith('rediss://'),
    'REDIS_URL must be a redis:// or rediss:// connection string',
  );
