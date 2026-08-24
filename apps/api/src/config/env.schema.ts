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

/** Minimum length for signing/peppering secrets, in characters. */
const MIN_SECRET_LENGTH = 32;

const secretSchema = z
  .string()
  .min(
    MIN_SECRET_LENGTH,
    `Must be at least ${MIN_SECRET_LENGTH} characters. Generate with: openssl rand -base64 48`,
  );

/**
 * SMS delivery provider.
 *
 * `log` writes the code to the application log and sends nothing. It exists so
 * the OTP flow can be developed and tested without a provider account; a boot
 * guard rejects it in production, because an authentication system that silently
 * fails to deliver codes is worse than one that refuses to start.
 */
export const SMS_PROVIDERS = ['log'] as const;

export const smsProviderSchema = z.enum(SMS_PROVIDERS);

/**
 * Document storage provider.
 *
 * `local` writes to a local directory and mints unexpiring `file://` URLs. It
 * exists so the verification workflow can be developed without an object-storage
 * account; a boot guard rejects it in production, where identity documents must be
 * durable and access must actually expire.
 */
export const DOCUMENT_STORAGE_PROVIDERS = ['local'] as const;

export const documentStorageProviderSchema = z.enum(DOCUMENT_STORAGE_PROVIDERS);

export const apiEnvSchema = z
  .object({
    NODE_ENV: environmentSchema.default('development'),

    PORT: portSchema.default(3000),

    LOG_LEVEL: logLevelSchema.default('info'),

    /** PostgreSQL is the source of truth for all state. */
    DATABASE_URL: postgresUrlSchema,

    /**
     * Backs caching, rate limiting and queues — never the source of truth.
     * Required in production, because rate limiting is a security control and an
     * unenforced limit on OTP requests is an open SMS-cost and brute-force hole.
     */
    REDIS_URL: redisUrlSchema.optional(),

    /** Comma-separated browser origins permitted to call the API. */
    CORS_ALLOWED_ORIGINS: z.string().optional(),

    /** Signs access tokens. Rotating it invalidates every issued access token. */
    JWT_SECRET: secretSchema,

    /**
     * Keys the HMAC applied to OTP codes before storage. Without a pepper, a
     * six-digit code's digest is reversible by brute force from a database dump.
     */
    OTP_HASH_PEPPER: secretSchema,

    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),

    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

    OTP_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(300),

    OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),

    SMS_PROVIDER: smsProviderSchema.default('log'),

    DOCUMENT_STORAGE_PROVIDER: documentStorageProviderSchema.default('local'),

    /** Directory used by the `local` provider. Ignored by any real provider. */
    DOCUMENT_STORAGE_DIR: z.string().min(1).default('./.local-documents'),

    /** Lifetime of a signed document URL. Short: these are identity papers. */
    DOCUMENT_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') {
      return;
    }

    if (env.REDIS_URL === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['REDIS_URL'],
        message: 'Required in production: rate limiting depends on it',
      });
    }

    if (env.SMS_PROVIDER === 'log') {
      ctx.addIssue({
        code: 'custom',
        path: ['SMS_PROVIDER'],
        message: 'The `log` provider does not deliver messages and must not be used in production',
      });
    }
  });

export type ApiEnv = z.infer<typeof apiEnvSchema>;
