import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { IdempotencyModule } from './common/idempotency/idempotency.module';
import { buildLoggerParams } from './common/logging/logger.options';
import { ZodValidationPipe } from './common/validation/zod-validation.pipe';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

/**
 * Application root.
 *
 * PHASE 0 SCOPE. The nineteen feature modules listed in 07_ARCHITECTURE.md
 * (auth, users, bookings, payments, …) are intentionally absent. Empty
 * placeholder modules would be structure without behaviour; each one arrives
 * with its own phase, migration and tests.
 *
 * The error filter and validation pipe are registered application-wide rather
 * than per-controller, so that a new endpoint gets the correct error envelope and
 * input validation by default instead of by remembering to opt in.
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
    IdempotencyModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}
