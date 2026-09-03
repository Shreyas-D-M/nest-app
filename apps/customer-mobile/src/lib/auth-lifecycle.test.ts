import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthSession, OtpRequestResult } from '@nest/types';
import { clearSession, getCurrentUser, getStoredSession, saveSession } from './auth-store';
import { ApiRequestError, logoutApi, requestOtp, verifyOtp } from './api';

const PHONE = '+919876543210';

const session1 = {
  tokens: {
    tokenType: 'Bearer',
    accessToken: 'access-token-1',
    expiresInSeconds: 900,
    refreshToken: 'refresh-token-1',
    refreshExpiresInSeconds: 30 * 24 * 60 * 60,
  },
  user: {
    id: 'user-uuid-1',
    phone: PHONE,
    email: null,
    name: 'Customer One',
    avatarUrl: null,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    createdAt: '2026-08-31T00:00:00.000Z',
    updatedAt: '2026-08-31T00:00:00.000Z',
  },
} as unknown as AuthSession;

const session2 = {
  tokens: {
    tokenType: 'Bearer',
    accessToken: 'access-token-2',
    expiresInSeconds: 900,
    refreshToken: 'refresh-token-2',
    refreshExpiresInSeconds: 30 * 24 * 60 * 60,
  },
  user: {
    id: 'user-uuid-1',
    phone: PHONE,
    email: null,
    name: 'Customer One',
    avatarUrl: null,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    createdAt: '2026-08-31T00:00:00.000Z',
    updatedAt: '2026-08-31T00:00:00.000Z',
  },
} as unknown as AuthSession;

describe('Customer Auth Lifecycle (Login -> Logout -> Re-login)', () => {
  beforeEach(async () => {
    await clearSession();
    vi.restoreAllMocks();
  });

  it('proves the complete 10-step authentication lifecycle', async () => {
    // Mock global fetch for API calls
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    // Step 1 & 2: First Login & Save Session
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        expiresInSeconds: 300,
        retryAfterSeconds: 60,
        devOtp: '123456',
      } as OtpRequestResult),
    });

    const req1 = await requestOtp(PHONE);
    expect(req1.devOtp).toBe('123456');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => session1,
    });

    const verified1 = await verifyOtp(PHONE, '123456');
    expect(verified1.tokens.accessToken).toBe('access-token-1');

    const stored1 = await getStoredSession();
    expect(stored1?.tokens.accessToken).toBe('access-token-1');
    expect(stored1?.user.phone).toBe(PHONE);

    // Step 3: Logout
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers({ 'content-length': '0' }),
      json: async () => null,
    });

    await logoutApi();

    // Step 4: Session is actually gone
    const storedAfterLogout = await getStoredSession();
    expect(storedAfterLogout).toBeNull();
    expect(await getCurrentUser()).toBeNull();

    // Step 5: Return to sign-in (simulated: clean slate, no demo session created)
    expect(await getStoredSession()).toBeNull();

    // Step 6: Request OTP again
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        expiresInSeconds: 300,
        retryAfterSeconds: 60,
        devOtp: '654321',
      } as OtpRequestResult),
    });

    const req2 = await requestOtp(PHONE);
    expect(req2.devOtp).toBe('654321');

    // Step 7: Verify OTP again
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => session2,
    });

    const verified2 = await verifyOtp(PHONE, '654321');
    expect(verified2.tokens.accessToken).toBe('access-token-2');

    // Step 8: New session is saved
    const stored2 = await getStoredSession();
    expect(stored2).not.toBeNull();
    expect(stored2?.tokens.accessToken).toBe('access-token-2');
    expect(stored2?.tokens.refreshToken).toBe('refresh-token-2');

    // Step 9 & 10: Auth context becomes authenticated again and points to active session
    const currentUser = await getCurrentUser();
    expect(currentUser?.id).toBe('user-uuid-1');
    expect(currentUser?.phone).toBe(PHONE);
  });

  it('correctly handles 429 RATE_LIMITED with retryAfterSeconds details without swallowing error', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Try again shortly.',
          details: { retryAfterSeconds: 42 },
        },
        requestId: 'req-rate-limit-1',
      }),
    });
    globalThis.fetch = fetchMock;

    try {
      await requestOtp(PHONE);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiRequestError);
      expect(err).toMatchObject({
        name: 'ApiRequestError',
        status: 429,
        code: 'RATE_LIMITED',
        retryAfterSeconds: 42,
        message: 'Please wait 42s before requesting another code.',
      });
    }
  });

  it('preserves exact server retryAfterSeconds (e.g. 17s) in error message', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Try again shortly.',
          details: { retryAfterSeconds: 17 },
        },
        requestId: 'req-rate-limit-17',
      }),
    });
    globalThis.fetch = fetchMock;

    try {
      await requestOtp(PHONE);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiRequestError);
      expect(err).toMatchObject({
        name: 'ApiRequestError',
        status: 429,
        code: 'RATE_LIMITED',
        retryAfterSeconds: 17,
        message: 'Please wait 17s before requesting another code.',
      });
    }
  });

  it('guarantees clearSession even if backend logout fails or returns error', async () => {
    await saveSession(session1);
    expect(await getStoredSession()).not.toBeNull();

    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('Network offline'));
    globalThis.fetch = fetchMock;

    await logoutApi();

    expect(await getStoredSession()).toBeNull();
  });
});
