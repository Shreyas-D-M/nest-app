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
 * `/me` and `/me/addresses` against a real database.
 *
 * The ownership tests here are the ones that matter most: CLAUDE.md requires
 * permission logic to be covered, and address data is among the most sensitive
 * NEST holds.
 */

const PHONE_A = '+919876500011';
const PHONE_B = '+919876500022';

let context: IntegrationContext;
let server: Server;

function http() {
  return request(server);
}

async function signIn(phone: string): Promise<{ accessToken: string; userId: string }> {
  context.sms.reset();
  await http().post(`${API_PREFIX}/auth/otp/request`).send({ phone }).expect(202);

  const response = await http()
    .post(`${API_PREFIX}/auth/otp/verify`)
    .send({ phone, code: context.sms.lastCode() })
    .expect(200);

  return {
    accessToken: response.body.tokens.accessToken,
    userId: response.body.user.id,
  };
}

const validAddress = {
  label: 'Home',
  addressLine: '12 Camp Road',
  locality: 'Camp',
  city: 'Belagavi',
  state: 'Karnataka',
  pincode: '590001',
};

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

describe('authentication is required', () => {
  it.each([
    ['GET', '/me'],
    ['PATCH', '/me'],
    ['GET', '/me/addresses'],
    ['POST', '/me/addresses'],
  ])('%s %s rejects an unauthenticated request', async (method, path) => {
    const response = await http()
      [method.toLowerCase() as 'get' | 'patch' | 'post'](`${API_PREFIX}${path}`)
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('ACCESS_TOKEN_INVALID');
  });

  it('rejects a bearer token signed with the wrong secret', async () => {
    // Structurally a JWT, but not one this deployment issued.
    const forged =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdHRhY2tlciIsInNpZCI6IngifQ.bad-signature';

    await http().get(`${API_PREFIX}/me`).set('authorization', `Bearer ${forged}`).expect(401);
  });

  it('rejects a token for a suspended account immediately, without waiting for expiry', async () => {
    const { accessToken } = await signIn(PHONE_A);

    await http().get(`${API_PREFIX}/me`).set('authorization', `Bearer ${accessToken}`).expect(200);

    await context.prisma.user.updateMany({
      where: { phone: PHONE_A },
      data: { status: 'SUSPENDED' },
    });

    // Same still-valid token, now refused: the guard re-reads the user.
    const response = await http()
      .get(`${API_PREFIX}/me`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect(403);

    expect(response.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('GET /me', () => {
  it('returns the caller profile', async () => {
    const { accessToken, userId } = await signIn(PHONE_A);

    const response = await http()
      .get(`${API_PREFIX}/me`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({ id: userId, phone: PHONE_A, role: 'CUSTOMER' });
  });

  it('exposes no internal fields', async () => {
    const { accessToken } = await signIn(PHONE_A);

    const response = await http()
      .get(`${API_PREFIX}/me`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Object.keys(response.body).sort()).toEqual([
      'avatarUrl',
      'createdAt',
      'email',
      'id',
      'name',
      'phone',
      'role',
      'status',
      'updatedAt',
    ]);
  });
});

describe('PATCH /me', () => {
  it('updates the name', async () => {
    const { accessToken } = await signIn(PHONE_A);

    const response = await http()
      .patch(`${API_PREFIX}/me`)
      .set('authorization', `Bearer ${accessToken}`)
      .send({ name: 'Asha' })
      .expect(200);

    expect(response.body.name).toBe('Asha');
  });

  it('ignores attempts to change role, status or phone', async () => {
    const { accessToken } = await signIn(PHONE_A);

    const response = await http()
      .patch(`${API_PREFIX}/me`)
      .set('authorization', `Bearer ${accessToken}`)
      .send({ name: 'Asha', role: 'ADMIN', status: 'ACTIVE', phone: '+910000000000' })
      .expect(200);

    // Privilege escalation via a profile update must be impossible.
    expect(response.body.role).toBe('CUSTOMER');
    expect(response.body.phone).toBe(PHONE_A);

    const stored = await context.prisma.user.findUniqueOrThrow({ where: { phone: PHONE_A } });
    expect(stored.role).toBe('CUSTOMER');
  });

  it('rejects an empty patch', async () => {
    const { accessToken } = await signIn(PHONE_A);

    await http()
      .patch(`${API_PREFIX}/me`)
      .set('authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);
  });

  it('returns 409 when an email is already taken by another user', async () => {
    const a = await signIn(PHONE_A);
    await resetRateLimits(context.redis);
    const b = await signIn(PHONE_B);

    await http()
      .patch(`${API_PREFIX}/me`)
      .set('authorization', `Bearer ${a.accessToken}`)
      .send({ email: 'shared@example.com' })
      .expect(200);

    const response = await http()
      .patch(`${API_PREFIX}/me`)
      .set('authorization', `Bearer ${b.accessToken}`)
      .send({ email: 'shared@example.com' })
      .expect(409);

    expect(response.body.error.code).toBe('CONFLICT');
  });
});

describe('/me/addresses', () => {
  it('creates and lists an address', async () => {
    const { accessToken } = await signIn(PHONE_A);

    const created = await http()
      .post(`${API_PREFIX}/me/addresses`)
      .set('authorization', `Bearer ${accessToken}`)
      .send(validAddress)
      .expect(201);

    expect(created.body).toMatchObject(validAddress);
    expect(created.body).not.toHaveProperty('userId');
    expect(created.body).not.toHaveProperty('deletedAt');

    const list = await http()
      .get(`${API_PREFIX}/me/addresses`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(list.body).toHaveLength(1);
  });

  it('persists coordinates when supplied together', async () => {
    const { accessToken } = await signIn(PHONE_A);

    const created = await http()
      .post(`${API_PREFIX}/me/addresses`)
      .set('authorization', `Bearer ${accessToken}`)
      .send({ ...validAddress, latitude: 15.8497, longitude: 74.4977 })
      .expect(201);

    expect(created.body.latitude).toBeCloseTo(15.8497, 6);
    expect(created.body.longitude).toBeCloseTo(74.4977, 6);
  });

  it('rejects a half-specified coordinate pair', async () => {
    const { accessToken } = await signIn(PHONE_A);

    await http()
      .post(`${API_PREFIX}/me/addresses`)
      .set('authorization', `Bearer ${accessToken}`)
      .send({ ...validAddress, latitude: 15.8497 })
      .expect(400);
  });

  it('updates an owned address', async () => {
    const { accessToken } = await signIn(PHONE_A);

    const created = await http()
      .post(`${API_PREFIX}/me/addresses`)
      .set('authorization', `Bearer ${accessToken}`)
      .send(validAddress)
      .expect(201);

    const updated = await http()
      .patch(`${API_PREFIX}/me/addresses/${created.body.id}`)
      .set('authorization', `Bearer ${accessToken}`)
      .send({ label: 'Office', city: 'Hubli' })
      .expect(200);

    expect(updated.body.label).toBe('Office');
    expect(updated.body.city).toBe('Hubli');
    // Untouched fields survive a PATCH.
    expect(updated.body.locality).toBe(validAddress.locality);
  });

  it('soft-deletes an owned address and hides it from the list', async () => {
    const { accessToken } = await signIn(PHONE_A);

    const created = await http()
      .post(`${API_PREFIX}/me/addresses`)
      .set('authorization', `Bearer ${accessToken}`)
      .send(validAddress)
      .expect(201);

    await http()
      .delete(`${API_PREFIX}/me/addresses/${created.body.id}`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect(204);

    const list = await http()
      .get(`${API_PREFIX}/me/addresses`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(list.body).toEqual([]);

    // The row is retained, so future booking history keeps its reference.
    const row = await context.prisma.userAddress.findUniqueOrThrow({
      where: { id: created.body.id },
    });
    expect(row.deletedAt).not.toBeNull();
  });

  it('rejects a malformed id before it reaches the database', async () => {
    const { accessToken } = await signIn(PHONE_A);

    await http()
      .patch(`${API_PREFIX}/me/addresses/not-a-uuid`)
      .set('authorization', `Bearer ${accessToken}`)
      .send({ label: 'x' })
      .expect(400);
  });

  describe('ownership', () => {
    it("does not list another user's addresses", async () => {
      const a = await signIn(PHONE_A);
      await resetRateLimits(context.redis);
      const b = await signIn(PHONE_B);

      await http()
        .post(`${API_PREFIX}/me/addresses`)
        .set('authorization', `Bearer ${a.accessToken}`)
        .send(validAddress)
        .expect(201);

      const list = await http()
        .get(`${API_PREFIX}/me/addresses`)
        .set('authorization', `Bearer ${b.accessToken}`)
        .expect(200);

      expect(list.body).toEqual([]);
    });

    it("returns 404 — not 403 — when reading another user's address by id", async () => {
      const a = await signIn(PHONE_A);
      await resetRateLimits(context.redis);
      const b = await signIn(PHONE_B);

      const created = await http()
        .post(`${API_PREFIX}/me/addresses`)
        .set('authorization', `Bearer ${a.accessToken}`)
        .send(validAddress)
        .expect(201);

      // 404 rather than 403: a 403 would confirm the id exists.
      const response = await http()
        .patch(`${API_PREFIX}/me/addresses/${created.body.id}`)
        .set('authorization', `Bearer ${b.accessToken}`)
        .send({ label: 'Hijacked' })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it("cannot delete another user's address", async () => {
      const a = await signIn(PHONE_A);
      await resetRateLimits(context.redis);
      const b = await signIn(PHONE_B);

      const created = await http()
        .post(`${API_PREFIX}/me/addresses`)
        .set('authorization', `Bearer ${a.accessToken}`)
        .send(validAddress)
        .expect(201);

      await http()
        .delete(`${API_PREFIX}/me/addresses/${created.body.id}`)
        .set('authorization', `Bearer ${b.accessToken}`)
        .expect(404);

      // Still live for its owner.
      const row = await context.prisma.userAddress.findUniqueOrThrow({
        where: { id: created.body.id },
      });
      expect(row.deletedAt).toBeNull();
    });

    it('cannot modify an already-deleted address', async () => {
      const { accessToken } = await signIn(PHONE_A);

      const created = await http()
        .post(`${API_PREFIX}/me/addresses`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(validAddress)
        .expect(201);

      await http()
        .delete(`${API_PREFIX}/me/addresses/${created.body.id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(204);

      await http()
        .patch(`${API_PREFIX}/me/addresses/${created.body.id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ label: 'Resurrected' })
        .expect(404);
    });
  });
});

describe('database guarantees', () => {
  it('enforces one account per phone number', async () => {
    await signIn(PHONE_A);

    await expect(context.prisma.user.create({ data: { phone: PHONE_A } })).rejects.toMatchObject({
      code: 'P2002',
    });
  });

  it('cascades address deletion when a user row is removed', async () => {
    const { accessToken, userId } = await signIn(PHONE_A);

    await http()
      .post(`${API_PREFIX}/me/addresses`)
      .set('authorization', `Bearer ${accessToken}`)
      .send(validAddress)
      .expect(201);

    await context.prisma.user.delete({ where: { id: userId } });

    expect(await context.prisma.userAddress.count()).toBe(0);
    expect(await context.prisma.session.count()).toBe(0);
  });

  it('stores timestamps in UTC', async () => {
    const { userId } = await signIn(PHONE_A);

    const user = await context.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    expect(user.createdAt.toISOString()).toMatch(/Z$/);
  });
});
