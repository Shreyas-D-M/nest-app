import {
  environmentSchema,
  logLevelSchema,
  portSchema,
  postgresUrlSchema,
  redisUrlSchema,
  z,
} from '@nest/validation';

/**
 * API environment contract.
 *
 * Anything the API needs from the environment is declared here and validated
 * once at boot. Secrets have no defaults: a missing secret must stop the
 * process, never fall back to something that appears to work.
 */
export const apiEnvSchema = z.object({
  NODE_ENV: environmentSchema.default('development'),

  PORT: portSchema.default(3000),

  LOG_LEVEL: logLevelSchema.default('info'),

  /** PostgreSQL is the source of truth for all state. */
  DATABASE_URL: postgresUrlSchema,

  /**
   * Optional. Redis backs caching, rate limiting and queues only; when it is
   * absent those features report as disabled rather than the API refusing to
   * start, because Redis is never the source of truth.
   */
  REDIS_URL: redisUrlSchema.optional(),

  /** Comma-separated browser origins permitted to call the API. */
  CORS_ALLOWED_ORIGINS: z.string().optional(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
