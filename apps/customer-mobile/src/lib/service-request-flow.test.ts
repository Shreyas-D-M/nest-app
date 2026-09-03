import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServiceRequest, uploadServiceRequestAttachment, getServiceRequest } from './api';
import * as authStore from './auth-store';

describe('Customer Service Request Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully creates a service request with customer text input', async () => {
    const mockSession = {
      tokens: {
        tokenType: 'Bearer' as const,
        accessToken: 'mock-access-token',
        expiresInSeconds: 900,
        refreshToken: 'mock-refresh-token',
        refreshExpiresInSeconds: 2592000,
      },
      user: {
        id: 'c5062c82-ec21-46cc-a638-f517ef70278e',
        phone: '+919876543210',
        email: null,
        name: 'Tejas',
        avatarUrl: null,
        role: 'CUSTOMER' as const,
        status: 'ACTIVE' as const,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
      expiresAt: Date.now() + 900000,
      accessTokenExpiresAt: Date.now() + 900000,
      refreshTokenExpiresAt: Date.now() + 2592000000,
    } as unknown as authStore.StoredAuthSession;

    vi.spyOn(authStore, 'getStoredSession').mockResolvedValue(mockSession);

    const mockResponse = {
      id: 'req-456',
      rawText: 'Air conditioner is leaking water from the indoor unit [Preferred timing: ASAP / Today]',
      voiceUrl: null,
      media: null,
      aiCategory: 'AC Repair',
      aiConfidence: 0.95,
      status: 'DRAFT',
      createdAt: '2026-09-01T00:00:00.000Z',
      address: null,
      bookingId: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    });

    const result = await createServiceRequest({
      rawText: 'Air conditioner is leaking water from the indoor unit [Preferred timing: ASAP / Today]',
    });

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/service-requests'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
        body: JSON.stringify({
          rawText: 'Air conditioner is leaking water from the indoor unit [Preferred timing: ASAP / Today]',
        }),
      }),
    );
  });

  it('uploads a photo attachment using native FormData without browser Blob fetching', async () => {
    const mockSession = {
      tokens: {
        tokenType: 'Bearer' as const,
        accessToken: 'mock-access-token',
        expiresInSeconds: 900,
        refreshToken: 'mock-refresh-token',
        refreshExpiresInSeconds: 2592000,
      },
      user: {
        id: 'c5062c82-ec21-46cc-a638-f517ef70278e',
        phone: '+919876543210',
        email: null,
        name: 'Tejas',
        avatarUrl: null,
        role: 'CUSTOMER' as const,
        status: 'ACTIVE' as const,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
      expiresAt: Date.now() + 900000,
      accessTokenExpiresAt: Date.now() + 900000,
      refreshTokenExpiresAt: Date.now() + 2592000000,
    } as unknown as authStore.StoredAuthSession;

    vi.spyOn(authStore, 'getStoredSession').mockResolvedValue(mockSession);

    const mockView = {
      id: 'req-456',
      rawText: 'AC repair',
      voiceUrl: null,
      media: ['service-request/SERVICE_REQUEST_MEDIA/photo-123.jpg'],
      aiCategory: 'AC Repair',
      aiConfidence: 0.9,
      status: 'DRAFT',
      createdAt: '2026-09-01T00:00:00.000Z',
      address: null,
      bookingId: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockView,
    });

    const result = await uploadServiceRequestAttachment('req-456', 'file:///data/user/0/cache/photo.jpg', 'image');

    expect(result).toEqual(mockView);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/service-requests/req-456/attachments'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }),
    );
  });

  it('fetches an existing service request by ID', async () => {
    const mockSession = {
      tokens: {
        tokenType: 'Bearer' as const,
        accessToken: 'mock-access-token',
        expiresInSeconds: 900,
        refreshToken: 'mock-refresh-token',
        refreshExpiresInSeconds: 2592000,
      },
      user: {
        id: 'c5062c82-ec21-46cc-a638-f517ef70278e',
        phone: '+919876543210',
        email: null,
        name: 'Tejas',
        avatarUrl: null,
        role: 'CUSTOMER' as const,
        status: 'ACTIVE' as const,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
      expiresAt: Date.now() + 900000,
      accessTokenExpiresAt: Date.now() + 900000,
      refreshTokenExpiresAt: Date.now() + 2592000000,
    } as unknown as authStore.StoredAuthSession;

    vi.spyOn(authStore, 'getStoredSession').mockResolvedValue(mockSession);

    const mockView = {
      id: 'req-789',
      rawText: 'Tap repair',
      voiceUrl: null,
      media: [],
      aiCategory: 'Plumbing',
      aiConfidence: 0.88,
      status: 'DRAFT',
      createdAt: '2026-09-01T00:00:00.000Z',
      address: {
        id: 'addr-1',
        label: 'Home',
        locality: 'Sadashiv Nagar',
        city: 'Belagavi',
      },
      bookingId: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockView,
    });

    const result = await getServiceRequest('req-789');

    expect(result).toEqual(mockView);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/service-requests/req-789'),
      expect.any(Object),
    );
  });

  it('rejects audio uploads on uploadServiceRequestAttachment with clear error', async () => {
    await expect(uploadServiceRequestAttachment('req-1', 'file:///audio.m4a', 'audio')).rejects.toThrow(
      'Audio attachments are not supported',
    );
  });
});
