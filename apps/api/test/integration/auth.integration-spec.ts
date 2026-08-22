import request from 'supertest';
import type { Server } from 'node:http';
import { API_PREFIX } from '@nest/types';
import {
  createIntegrationApp,
  resetDatabase,
  resetRateLimits,
  type IntegrationContext,
} from './harness';

/**
 * Authentication, end to end, against real PostgreSQL and Redis.
 *
 * These suites exercise what mocked unit tests cannot: unique constraints,
 * transactional rotation, soft-delete filtering, and the HTTP surface as a client
 * actually meets it.
 */

const PHONE = '+919876500001';

let context: IntegrationContext;
let server: Server;

function http() {
  return request(server);
}

/** Requests a code and returns the value that was "sent". */
async function requestCode(phone: string): Promise<string> {
  context.sms.reset();

  await http().post(`${API_PREFIX}/auth/otp/request`).send({ phone }).expect(202);

  return context.sms.lastCode();
}

interface SignedIn {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

/** Completes a full sign-in and returns the issued tokens. */
async function signIn(phone: string): Promise<SignedIn> {
  const code = await requestCode(phone);

  const response = await http()
    .post(`${API_PREFIX}/auth/otp/verify`)
    .send({ phone, code })
    .expect(200);

  return {
    accessToken: response.body.tokens.accessToken,
    refreshToken: response.body.tokens.refreshToken,
    userId: response.body.user.id,
  };
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
  await resetRateLimits(context.redis);
  context.sms.reset();
});

describe('POST /auth/otp/request', () => {
  it('accepts a valid number and sends a code', async () => {
    const response = await http()
      .post(`${API_PREFIX}/auth/otp/request`)
      .send({ phone: PHONE })
      .expect(202);

    expect(response.body).toEqual({
      expiresInSeconds: expect.any(Number),
      retryAfterSeconds: expect.any(Number),
    });
    expect(context.sms.messages).toHaveLength(1);
    expect(context.sms.lastCode()).toMatch(/^\d{6}$/);
  });

  it('never returns the code in the response body', async () => {
    const response = await http()
      .post(`${API_PREFIX}/auth/otp/request`)
      .send({ phone: PHONE })
      .expect(202);

    expect(JSON.stringify(response.body)).not.toContain(context.sms.lastCode());
  });

  it('stores only a hash of the code', async () => {
    const code = await requestCode(PHONE);

    const challenge = await context.prisma.otpChallenge.findFirstOrThrow({
      where: { phone: PHONE },
    });

    expect(challenge.codeHash).toHaveLength(64);
    expect(challenge.codeHash).not.toContain(code);
  });

  it('responds identically for a registered and an unregistered number', async () => {
    await signIn(PHONE);
    await resetRateLimits(context.redis);

    const registered = await http()
      .post(`${API_PREFIX}/auth/otp/request`)
      .send({ phone: PHONE })
      .expect(202);

    await resetRateLimits(context.redis);

    const unregistered = await http()
      .post(`${API_PREFIX}/auth/otp/request`)
      .send({ phone: '+919876500999' })
      .expect(202);

    // No account-enumeration oracle.
    expect(Object.keys(registered.body)).toEqual(Object.keys(unregistered.body));
    expect(registered.status).toBe(unregistered.status);
  });

  it('rejects a malformed phone number with the documented envelope', async () => {
    const response = await http()
      .post(`${API_PREFIX}/auth/otp/request`)
      .send({ phone: '9876543210' })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_FAILED',
        message: expect.any(String),
        details: expect.any(Object),
      },
      requestId: expect.any(String),
    });
  });

  it('supersedes an earlier code, so only the newest one works', async () => {
    const firstCode = await requestCode(PHONE);
    await resetRateLimits(context.redis);
    const secondCode = await requestCode(PHONE);

    expect(firstCode).not.toBe(secondCode);

    await http()
      .post(`${API_PREFIX}/auth/otp/verify`)
      .send({ phone: PHONE, code: firstCode })
      .expect(401);

    await http()
      .post(`${API_PREFIX}/auth/otp/verify`)
      .send({ phone: PHONE, code: secondCode })
      .expect(200);
  });
});

describe('POST /auth/otp/verify', () => {
  it('creates the account on first sign-in and returns tokens', async () => {
    const code = await requestCode(PHONE);

    const response = await http()
      .post(`${API_PREFIX}/auth/otp/verify`)
      .send({ phone: PHONE, code })
      .expect(200);

    expect(response.body.tokens).toEqual({
      tokenType: 'Bearer',
      accessToken: expect.any(String),
      expiresInSeconds: expect.any(Number),
      refreshToken: expect.any(String),
      refreshExpiresInSeconds: expect.any(Number),
    });
    expect(response.body.user).toMatchObject({
      phone: PHONE,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      name: null,
      email: null,
    });

    const users = await context.prisma.user.findMany();
    expect(users).toHaveLength(1);
  });

  it('reuses the existing account on a later sign-in', async () => {
    const first = await signIn(PHONE);
    await resetRateLimits(context.redis);
    const second = await signIn(PHONE);

    expect(second.userId).toBe(first.userId);
    expect(await context.prisma.user.count()).toBe(1);
  });

  it('burns the code after one successful use', async () => {
    const code = await requestCode(PHONE);

    await http().post(`${API_PREFIX}/auth/otp/verify`).send({ phone: PHONE, code }).expect(200);

    // Replaying a consumed code must not produce a second session.
    const replay = await http()
      .post(`${API_PREFIX}/auth/otp/verify`)
      .send({ phone: PHONE, code })
      .expect(401);

    expect(replay.body.error.code).toBe('OTP_EXPIRED');
    expect(await context.prisma.session.count()).toBe(1);
  });

  it('rejects a wrong code and counts the attempt', async () => {
    await requestCode(PHONE);

    const response = await http()
      .post(`${API_PREFIX}/auth/otp/verify`)
      .send({ phone: PHONE, code: '000000' })
      .expect(401);

    expect(response.body.error.code).toBe('OTP_INVALID');

    const challenge = await context.prisma.otpChallenge.findFirstOrThrow({
      where: { phone: PHONE },
    });
    expect(challenge.attemptCount).toBe(1);
  });

  it('locks the challenge after the configured number of wrong guesses', async () => {
    const code = await requestCode(PHONE);
    const wrongCode = code === '000000' ? '111111' : '000000';

    // Five wrong guesses: the fifth reaches the ceiling.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await http()
        .post(`${API_PREFIX}/auth/otp/verify`)
        .send({ phone: PHONE, code: wrongCode })
        .expect(401);
    }

    const locked = await http()
      .post(`${API_PREFIX}/auth/otp/verify`)
      .send({ phone: PHONE, code: wrongCode })
      .expect(429);

    expect(locked.body.error.code).toBe('OTP_MAX_ATTEMPTS');

    // The correct code no longer works either — the challenge is burned, so an
    // attacker cannot keep guessing and a fresh, rate-limited code is required.
    const afterLock = await http()
      .post(`${API_PREFIX}/auth/otp/verify`)
      .send({ phone: PHONE, code })
      .expect(401);

    expect(afterLock.body.error.code).toBe('OTP_EXPIRED');
  });

  it('rejects an expired code', async () => {
    const code = await requestCode(PHONE);

    // Age the challenge rather than waiting out the TTL.
    await context.prisma.otpChallenge.updateMany({
      where: { phone: PHONE },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await http()
      .post(`${API_PREFIX}/auth/otp/verify`)
      .send({ phone: PHONE, code })
      .expect(401);

    expect(response.body.error.code).toBe('OTP_EXPIRED');
  });

  it('refuses a suspended account even with the correct code', async () => {
    await signIn(PHONE);
    await context.prisma.user.updateMany({
      where: { phone: PHONE },
      data: { status: 'SUSPENDED' },
    });
    await resetRateLimits(context.redis);

    const code = await requestCode(PHONE);

    const response = await http()
      .post(`${API_PREFIX}/auth/otp/verify`)
      .send({ phone: PHONE, code })
      .expect(403);

    expect(response.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });

  it('stores only a hash of the refresh token', async () => {
    const { refreshToken } = await signIn(PHONE);

    const session = await context.prisma.session.findFirstOrThrow();

    expect(session.refreshTokenHash).toHaveLength(64);
    expect(session.refreshTokenHash).not.toContain(refreshToken);
  });
});

describe('POST /auth/refresh', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const { refreshToken } = await signIn(PHONE);

    const response = await http()
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken })
      .expect(200);

    expect(response.body.tokens.refreshToken).not.toBe(refreshToken);
    expect(response.body.tokens.accessToken).toEqual(expect.any(String));
    expect(await context.prisma.session.count()).toBe(2);
  });

  it('retires the presented token', async () => {
    const { refreshToken } = await signIn(PHONE);

    await http().post(`${API_PREFIX}/auth/refresh`).send({ refreshToken }).expect(200);

    const retired = await context.prisma.session.findFirstOrThrow({
      where: { revokedAt: { not: null } },
    });

    expect(retired.replacedById).not.toBeNull();
  });

  it('detects replay and revokes the entire family', async () => {
    const { refreshToken } = await signIn(PHONE);

    const rotated = await http()
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken })
      .expect(200);

    const rotatedToken = rotated.body.tokens.refreshToken as string;

    // Replaying the retired token: indistinguishable from theft.
    const replay = await http()
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken })
      .expect(401);

    expect(replay.body.error.code).toBe('REFRESH_TOKEN_INVALID');

    // The legitimate holder's token is dead too — the whole family was revoked.
    await http()
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken: rotatedToken })
      .expect(401);

    const live = await context.prisma.session.count({ where: { revokedAt: null } });
    expect(live).toBe(0);
  });

  it('rejects an unknown token', async () => {
    await http()
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken: 'A'.repeat(64) })
      .expect(401);
  });

  it('rejects an expired token', async () => {
    const { refreshToken } = await signIn(PHONE);

    await context.prisma.session.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await http().post(`${API_PREFIX}/auth/refresh`).send({ refreshToken }).expect(401);
  });

  it('refuses to refresh a suspended account and kills its sessions', async () => {
    const { refreshToken } = await signIn(PHONE);
    await context.prisma.user.updateMany({
      where: { phone: PHONE },
      data: { status: 'SUSPENDED' },
    });

    const response = await http()
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken })
      .expect(403);

    expect(response.body.error.code).toBe('ACCOUNT_SUSPENDED');
    expect(await context.prisma.session.count({ where: { revokedAt: null } })).toBe(0);
  });
});

describe('POST /auth/logout', () => {
  it('revokes the session and returns 204', async () => {
    const { refreshToken } = await signIn(PHONE);

    await http().post(`${API_PREFIX}/auth/logout`).send({ refreshToken }).expect(204);

    expect(await context.prisma.session.count({ where: { revokedAt: null } })).toBe(0);
  });

  it('prevents the revoked token from being refreshed', async () => {
    const { refreshToken } = await signIn(PHONE);

    await http().post(`${API_PREFIX}/auth/logout`).send({ refreshToken }).expect(204);
    await http().post(`${API_PREFIX}/auth/refresh`).send({ refreshToken }).expect(401);
  });

  it('is idempotent and reveals nothing about unknown tokens', async () => {
    const { refreshToken } = await signIn(PHONE);

    await http().post(`${API_PREFIX}/auth/logout`).send({ refreshToken }).expect(204);
    await http().post(`${API_PREFIX}/auth/logout`).send({ refreshToken }).expect(204);
    await http()
      .post(`${API_PREFIX}/auth/logout`)
      .send({ refreshToken: 'B'.repeat(64) })
      .expect(204);
  });
});
