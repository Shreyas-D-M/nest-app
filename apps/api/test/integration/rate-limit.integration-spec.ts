import request from 'supertest';
import type { Server } from 'node:http';
import { API_PREFIX } from '@nest/types';
import {
  createIntegrationApp,
  resetDatabase,
  resetRateLimits,
  type IntegrationContext,
} from './harness';
import { OTP_REQUEST_PER_PHONE } from '../../src/modules/auth/auth.rate-limits';

/**
 * Rate limiting against real Redis.
 *
 * 06_API_SPEC.md requires OTP and auth endpoints to be rate limited. These tests
 * assert the counters actually engage through the HTTP surface, and that they are
 * genuinely stored in Redis rather than in process memory — a per-process limit
 * stops being a limit as soon as the API is scaled.
 *
 * Unlike the other suites, this one does NOT reset counters before every test: the
 * accumulation is the behaviour under test.
 */

let context: IntegrationContext;
let server: Server;

function http() {
  return request(server);
}

/** A distinct number per test, so tests cannot exhaust each other's budget. */
let phoneCounter = 0;

function nextPhone(): string {
  phoneCounter += 1;

  return `+9198765${String(10_000 + phoneCounter).slice(-5)}`;
}

beforeAll(async () => {
  context = await createIntegrationApp();
  server = context.app.getHttpServer() as Server;
});

afterAll(async () => {
  await context.app.close();
});

beforeEach(async () => {
  await resetDatabase(context.prisma);
  context.sms.reset();
});

describe('Redis-backed rate limiting', () => {
  it('uses Redis, not process memory', () => {
    expect(context.redis.isEnabled).toBe(true);
  });

  it('enforces a cooldown between code requests for the same number', async () => {
    await resetRateLimits(context.redis);
    const phone = nextPhone();

    await http().post(`${API_PREFIX}/auth/otp/request`).send({ phone }).expect(202);

    const throttled = await http()
      .post(`${API_PREFIX}/auth/otp/request`)
      .send({ phone })
      .expect(429);

    expect(throttled.body.error.code).toBe('RATE_LIMITED');
    expect(throttled.body.error.details.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('writes its counters into Redis', async () => {
    await resetRateLimits(context.redis);
    const phone = nextPhone();

    await http().post(`${API_PREFIX}/auth/otp/request`).send({ phone }).expect(202);

    const keys = await context.redis.getClient().keys('ratelimit:*');

    expect(keys.some((key) => key.includes(phone))).toBe(true);
  });

  it('gives each counter a TTL, so a limit is a window and not a permanent block', async () => {
    await resetRateLimits(context.redis);
    const phone = nextPhone();

    await http().post(`${API_PREFIX}/auth/otp/request`).send({ phone }).expect(202);

    const client = context.redis.getClient();
    const keys = await client.keys(`ratelimit:*${phone}*`);
    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      expect(await client.ttl(key)).toBeGreaterThan(0);
    }
  });

  it('limits total codes per number per hour', async () => {
    await resetRateLimits(context.redis);
    const phone = nextPhone();
    const client = context.redis.getClient();

    let allowed = 0;

    for (let attempt = 0; attempt < OTP_REQUEST_PER_PHONE.limit + 1; attempt += 1) {
      // Clear only the short cooldown, leaving the hourly counter intact, so the
      // hourly ceiling is what this test measures.
      const cooldownKeys = await client.keys(`ratelimit:otp:cooldown:phone:${phone}`);

      if (cooldownKeys.length > 0) {
        await client.del(...cooldownKeys);
      }

      const response = await http().post(`${API_PREFIX}/auth/otp/request`).send({ phone });

      if (response.status === 202) {
        allowed += 1;
      } else {
        expect(response.status).toBe(429);
        break;
      }
    }

    expect(allowed).toBe(OTP_REQUEST_PER_PHONE.limit);
  });

  it('counts numbers independently, so one caller cannot lock out another', async () => {
    await resetRateLimits(context.redis);
    const first = nextPhone();
    const second = nextPhone();

    await http().post(`${API_PREFIX}/auth/otp/request`).send({ phone: first }).expect(202);
    await http().post(`${API_PREFIX}/auth/otp/request`).send({ phone: first }).expect(429);

    // A different number still has its own budget.
    await http().post(`${API_PREFIX}/auth/otp/request`).send({ phone: second }).expect(202);
  });

  it('does not consume a code request when the request is rejected as invalid', async () => {
    await resetRateLimits(context.redis);

    await http().post(`${API_PREFIX}/auth/otp/request`).send({ phone: 'nonsense' }).expect(400);

    // Validation runs before the limiter, so malformed input cannot be used to
    // burn a victim's quota.
    const keys = await context.redis.getClient().keys('ratelimit:otp:req:phone:*');
    expect(keys).toEqual([]);
  });
});
