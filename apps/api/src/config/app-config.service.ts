import { Injectable } from '@nestjs/common';
import type { Environment } from '@nest/types';
import type { LogLevel } from '@nest/validation';
import type {
  ApiEnv,
  DOCUMENT_STORAGE_PROVIDERS,
  SMS_PROVIDERS,
  PAYMENT_PROVIDERS,
  TRANSCRIPTION_PROVIDERS,
} from './env.schema';

type SmsProvider = (typeof SMS_PROVIDERS)[number];

type DocumentStorageProvider = (typeof DOCUMENT_STORAGE_PROVIDERS)[number];

type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];
type TranscriptionProvider = (typeof TRANSCRIPTION_PROVIDERS)[number];

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

  // --- Authentication -------------------------------------------------------
  //
  // `jwtSecret` and `otpHashPepper` are secrets. They are exposed only to the
  // services that must compute with them and must never be logged, returned in a
  // response, or included in an error.

  get jwtSecret(): string {
    return this.env.JWT_SECRET;
  }

  get otpHashPepper(): string {
    return this.env.OTP_HASH_PEPPER;
  }

  get accessTokenTtlSeconds(): number {
    return this.env.ACCESS_TOKEN_TTL_SECONDS;
  }

  get refreshTokenTtlSeconds(): number {
    return this.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;
  }

  get otpTtlSeconds(): number {
    return this.env.OTP_TTL_SECONDS;
  }

  get otpMaxAttempts(): number {
    return this.env.OTP_MAX_ATTEMPTS;
  }

  get smsProvider(): SmsProvider {
    return this.env.SMS_PROVIDER;
  }

  // --- Document storage -----------------------------------------------------

  get documentStorageProvider(): DocumentStorageProvider {
    return this.env.DOCUMENT_STORAGE_PROVIDER;
  }

  get documentStorageDir(): string {
    return this.env.DOCUMENT_STORAGE_DIR;
  }

  get documentUrlTtlSeconds(): number {
    return this.env.DOCUMENT_URL_TTL_SECONDS;
  }

  /**
   * Timezone that recurring availability windows are expressed in.
   *
   * A constant for the single-city launch. It becomes a per-service-area column
   * if NEST ever operates across timezones.
   */
  get operatingTimezone(): string {
    return 'Asia/Kolkata';
  }

  // --- Payment processing -------------------------------------------------------

  get paymentProvider(): PaymentProvider {
    return this.env.PAYMENT_PROVIDER;
  }

  get transcriptionProvider(): TranscriptionProvider {
    return this.env.TRANSCRIPTION_PROVIDER;
  }

  get localTranscriptionUrl(): string | undefined {
    return this.env.LOCAL_TRANSCRIPTION_URL;
  }

  get openAiApiKey(): string | undefined {
    return this.env.OPENAI_API_KEY;
  }
}
