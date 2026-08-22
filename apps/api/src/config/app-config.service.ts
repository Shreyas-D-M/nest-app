import { Injectable } from '@nestjs/common';
import type { Environment } from '@nest/types';
import type { LogLevel } from '@nest/validation';
import type { ApiEnv } from './env.schema';

/**
 * Typed access to validated configuration.
 *
 * Consumers read named properties instead of touching `process.env`, so that
 * every configuration value has one definition and one validation rule.
 *
 * `databaseUrl` and `redisUrl` are credentials. They are returned for the
 * clients that need to connect and must never be logged or included in an
 * error response.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly env: ApiEnv) {}

  get environment(): Environment {
    return this.env.NODE_ENV;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }

  get port(): number {
    return this.env.PORT;
  }

  get logLevel(): LogLevel {
    return this.env.LOG_LEVEL;
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get redisUrl(): string | undefined {
    return this.env.REDIS_URL;
  }

  get isRedisConfigured(): boolean {
    return this.env.REDIS_URL !== undefined;
  }

  get corsAllowedOrigins(): readonly string[] {
    const raw = this.env.CORS_ALLOWED_ORIGINS;

    if (raw === undefined || raw.trim() === '') {
      return [];
    }

    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }
}
