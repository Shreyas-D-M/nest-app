import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listAddresses, createAddress, updateAddress, deleteAddress } from './api';
import * as authStore from './auth-store';

describe('Customer Address Management', () => {
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

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authStore, 'getStoredSession').mockResolvedValue(mockSession);
  });

  it('lists customer saved addresses from /api/v1/me/addresses', async () => {
    const mockAddresses = [
      {
        id: 'addr-1',
        label: 'Home',
        addressLine: 'Flat B-204, Sunrise Heights',
        locality: 'Tilakwadi',
        city: 'Belagavi',
        state: 'Karnataka',
        pincode: '590006',
        instructions: 'Gate code 1234',
      },
      {
        id: 'addr-2',
        label: 'Office',
        addressLine: 'Tech Park, 4th Floor',
        locality: 'Camp',
        city: 'Belagavi',
        state: 'Karnataka',
        pincode: '590001',
        instructions: null,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockAddresses,
    });

    const result = await listAddresses();
    expect(result).toEqual(mockAddresses);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/me/addresses'),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });

  it('creates a new address via POST /api/v1/me/addresses', async () => {
    const newAddressInput = {
      label: 'Home',
      addressLine: 'Flat B-204, Sunrise Heights',
      locality: 'Tilakwadi',
      city: 'Belagavi',
      state: 'Karnataka',
      pincode: '590006',
      instructions: 'Ring doorbell twice',
    };

    const mockCreated = {
      id: 'addr-new-123',
      ...newAddressInput,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockCreated,
    });

    const result = await createAddress(newAddressInput);
    expect(result).toEqual(mockCreated);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/me/addresses'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newAddressInput),
      }),
    );
  });

  it('updates an existing address via PATCH /api/v1/me/addresses/:id', async () => {
    const updateInput = {
      instructions: 'Leave at front security desk',
    };

    const mockUpdated = {
      id: 'addr-1',
      label: 'Home',
      addressLine: 'Flat B-204, Sunrise Heights',
      locality: 'Tilakwadi',
      city: 'Belagavi',
      state: 'Karnataka',
      pincode: '590006',
      instructions: 'Leave at front security desk',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockUpdated,
    });

    const result = await updateAddress('addr-1', updateInput);
    expect(result).toEqual(mockUpdated);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/me/addresses/addr-1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(updateInput),
      }),
    );
  });

  it('deletes an address via DELETE /api/v1/me/addresses/:id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers({}),
      json: async () => ({}),
    });

    await deleteAddress('addr-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/me/addresses/addr-1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
