/**
 * Environment for the integration suites.
 *
 * Values point at the local docker-compose services. They are development-only
 * credentials for a throwaway database and are not secrets — the compose file
 * publishes the same ones.
 *
 * The database is `nest_test`, never `nest_dev`: these suites truncate tables
 * between tests and must not be able to destroy development data.
 *
 * PostgreSQL is on host port 5433 because 5432 is commonly already taken by
 * another project's Postgres.
 */

export const INTEGRATION_DATABASE_URL =
  process.env['INTEGRATION_DATABASE_URL'] ??
  'postgresql://nest:nest_local_dev@localhost:5433/nest_test?schema=public';

export const INTEGRATION_REDIS_URL =
  process.env['INTEGRATION_REDIS_URL'] ?? 'redis://localhost:6379';

/** Non-functional test secrets, long enough to satisfy the environment schema. */
export const INTEGRATION_JWT_SECRET = 'integration-jwt-secret-not-a-real-secret';

export const INTEGRATION_OTP_PEPPER = 'integration-otp-pepper-not-a-real-secret';

/** Applies the integration environment to `process.env`. */
export function applyIntegrationEnv(): void {
  process.env['NODE_ENV'] = 'test';
  process.env['LOG_LEVEL'] = 'error';
  process.env['DATABASE_URL'] = INTEGRATION_DATABASE_URL;
  process.env['REDIS_URL'] = INTEGRATION_REDIS_URL;
  process.env['JWT_SECRET'] = INTEGRATION_JWT_SECRET;
  process.env['OTP_HASH_PEPPER'] = INTEGRATION_OTP_PEPPER;
  process.env['SMS_PROVIDER'] = 'log';
  delete process.env['CORS_ALLOWED_ORIGINS'];
}
