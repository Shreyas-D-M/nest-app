import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { SMS_SENDER, type SmsMessage, type SmsSender } from '../../src/modules/auth/sms/sms-sender';
import { applyIntegrationEnv } from './env';

/**
 * Shared harness for the integration suites.
 *
 * Everything runs against the real PostgreSQL and Redis containers. Only SMS is
 * substituted — there is no provider to deliver through, and capturing the message
 * is how a test learns the OTP code, exactly as a user would read it from their
 * phone.
 */

/** Records outgoing messages so a test can read the code that was sent. */
export class CapturingSmsSender implements SmsSender {
  readonly messages: SmsMessage[] = [];

  send(message: SmsMessage): Promise<void> {
    this.messages.push(message);

    return Promise.resolve();
  }

  /** The six-digit code from the most recent message. */
  lastCode(): string {
    const last = this.messages.at(-1);

    if (last === undefined) {
      throw new Error('No SMS was sent');
    }

    const match = /\b(\d{6})\b/.exec(last.body);

    if (match?.[1] === undefined) {
      throw new Error(`No six-digit code found in SMS body: ${last.body}`);
    }

    return match[1];
  }

  reset(): void {
    this.messages.length = 0;
  }
}

export interface IntegrationContext {
  app: INestApplication;
  prisma: PrismaService;
  redis: RedisService;
  sms: CapturingSmsSender;
}

export async function createIntegrationApp(): Promise<IntegrationContext> {
  applyIntegrationEnv();

  const sms = new CapturingSmsSender();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(SMS_SENDER)
    .useValue(sms)
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
    redis: app.get(RedisService),
    sms,
  };
}

/**
 * Empties every identity table.
 *
 * One statement so the truncation is atomic, and CASCADE because addresses and
 * sessions reference users.
 */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "sessions", "user_addresses", "otp_challenges", "users" CASCADE',
  );
}

/**
 * Clears rate-limit counters between tests.
 *
 * Without this, limits leak across tests and a later test fails because of an
 * earlier one's traffic. The limits themselves are asserted in a dedicated suite
 * that deliberately does not clear them.
 */
export async function resetRateLimits(redis: RedisService): Promise<void> {
  if (!redis.isEnabled) {
    return;
  }

  const client = redis.getClient();
  const keys = await client.keys('ratelimit:*');

  if (keys.length > 0) {
    await client.del(...keys);
  }
}
