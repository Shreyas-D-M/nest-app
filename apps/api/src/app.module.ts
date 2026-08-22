import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { IdempotencyModule } from './common/idempotency/idempotency.module';
import { buildLoggerParams } from './common/logging/logger.options';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { ZodValidationPipe } from './common/validation/zod-validation.pipe';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { AddressesModule } from './modules/addresses/addresses.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccessTokenGuard } from './modules/auth/guards/access-token.guard';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

/**
 * Application root.
 *
 * SCOPE: Phase 0 foundation + Phase 1 identity. The remaining feature modules
 * from 07_ARCHITECTURE.md (services, professionals, bookings, payments, …) are
 * intentionally absent; each arrives with its own phase, migration and tests.
 *
 * The three application-wide providers are registered here rather than
 * per-controller, so a new endpoint inherits the correct error envelope, input
 * validation, and authentication by default instead of by remembering to opt in:
 *
 *   APP_FILTER — every thrown value becomes the envelope from 06_API_SPEC.md.
 *   APP_PIPE   — every Zod DTO parameter is validated.
 *   APP_GUARD  — every route requires a valid access token unless marked
 *                `@Public()`. Secure by default: forgetting the decorator makes an
 *                endpoint unreachable, which is noticed at once, whereas
 *                forgetting to add a guard would silently expose it.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: buildLoggerParams,
    }),
    PrismaModule,
    RedisModule,
    RateLimitModule,
    IdempotencyModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AddressesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_GUARD, useClass: AccessTokenGuard },
  ],
})
export class AppModule {}
