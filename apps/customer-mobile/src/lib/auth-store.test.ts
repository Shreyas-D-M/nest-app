import { describe, expect, it } from 'vitest';
import type { AuthSession } from '@nest/types';
import { clearSession, getStoredSession, saveSession } from './auth-store';

const session = {
  tokens: {
    tokenType: 'Bearer',
    accessToken: 'access-token',
    expiresInSeconds: 900,
    refreshToken: 'refresh-token',
    refreshExpiresInSeconds: 30 * 24 * 60 * 60,
  },
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    phone: '+919876543210',
    email: null,
    name: null,
    avatarUrl: null,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    createdAt: '2026-08-31T00:00:00.000Z',
    updatedAt: '2026-08-31T00:00:00.000Z',
  },
} as AuthSession;

describe('customer auth session storage', () => {
  it('persists an OTP-authenticated session with both tokens and expiry information', async () => {
    await clearSession();
    await saveSession(session);

    const stored = await getStoredSession();

    expect(stored?.tokens.accessToken).toBe(session.tokens.accessToken);
    expect(stored?.tokens.refreshToken).toBe(session.tokens.refreshToken);
    expect(stored?.accessTokenExpiresAt).toBeTypeOf('number');
    expect(stored?.refreshTokenExpiresAt).toBeTypeOf('number');
  });

  it('does not recreate a session after logout/bootstrap', async () => {
    await clearSession();

    expect(await getStoredSession()).toBeNull();
  });
});
