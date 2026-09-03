import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminStats,
  listAdminProfessionals,
  approveProfessional,
  rejectProfessional,
  listAdminBookings,
  cancelAdminBooking,
  listAdminPayments,
  refundAdminPayment,
  createAdminService,
} from './api';
import * as auth from './auth';

describe('Admin Web API Client', () => {
  const mockSession = {
    tokens: {
      tokenType: 'Bearer' as const,
      accessToken: 'mock-admin-token',
      expiresInSeconds: 900,
      refreshToken: 'mock-admin-refresh',
      refreshExpiresInSeconds: 2592000,
    },
    user: {
      id: 'admin-1',
      phone: '+919876543210',
      email: 'admin@nest.app',
      name: 'Super Admin',
      avatarUrl: null,
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auth, 'getStoredSession').mockReturnValue(mockSession as unknown as auth.StoredSession);
  });

  it('fetches admin platform stats via GET /api/v1/admin/stats', async () => {
    const mockStats = {
      users: { totalCustomers: 10, totalProfessionals: 5, professionalsByStatus: {} },
      bookings: { total: 25, completed: 20, cancelled: 2, byStatus: {} },
      payments: { totalRevenueMinor: 500000, pending: 0, failed: 0 },
      support: { openTickets: 1 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockStats,
    });

    const result = await getAdminStats();
    expect(result).toEqual(mockStats);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/stats'),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });

  it('lists professionals via GET /api/v1/admin/professionals', async () => {
    const mockResponse = {
      items: [
        {
          id: 'pro-1',
          businessName: 'AC Repairs',
          verificationStatus: 'PENDING_REVIEW',
          onlineStatus: 'OFFLINE',
          documentCount: 2,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    });

    const result = await listAdminProfessionals('PENDING_REVIEW');
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/professionals?status=PENDING_REVIEW'),
      expect.any(Object),
    );
  });

  it('approves professional verification via POST /api/v1/admin/professionals/:id/approve', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    });

    await approveProfessional('pro-1', 'Approved');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/professionals/pro-1/approve'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ notes: 'Approved' }),
      }),
    );
  });

  it('rejects professional verification via POST /api/v1/admin/professionals/:id/reject', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    });

    await rejectProfessional('pro-1', 'Invalid document');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/professionals/pro-1/reject'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ reason: 'Invalid document' }),
      }),
    );
  });

  it('lists bookings via GET /api/v1/admin/bookings', async () => {
    const mockBookings = {
      items: [{ id: 'b-1', status: 'REQUESTED' }],
      total: 1,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockBookings,
    });

    const result = await listAdminBookings();
    expect(result).toEqual(mockBookings);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/bookings'),
      expect.any(Object),
    );
  });

  it('cancels a booking as admin via POST /api/v1/admin/bookings/:id/cancel', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    });

    await cancelAdminBooking('b-1', 'Admin cancelled');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/bookings/b-1/cancel'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ reason: 'Admin cancelled' }),
      }),
    );
  });

  it('lists payments via GET /api/v1/admin/payments', async () => {
    const mockPayments = {
      items: [{ id: 'pay-1', amountMinor: 50000, status: 'SUCCEEDED' }],
      total: 1,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockPayments,
    });

    const result = await listAdminPayments('SUCCEEDED');
    expect(result).toEqual(mockPayments);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/payments?status=SUCCEEDED'),
      expect.any(Object),
    );
  });

  it('processes refund via POST /api/v1/admin/payments/:id/refund', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 'ref-1', status: 'REFUNDED' }),
    });

    await refundAdminPayment('pay-1', { amountMinor: 49900, reason: 'Duplicate charge' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/payments/pay-1/refund'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ amountMinor: 49900, reason: 'Duplicate charge' }),
      }),
    );
  });

  it('creates new catalog service via POST /api/v1/admin/services', async () => {
    const input = {
      name: 'Fan Repair',
      categoryId: 'cat-1',
      description: 'Ceiling fan inspection and capacitor repair',
      basePriceMinor: 29900,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 'svc-new', ...input }),
    });

    await createAdminService(input);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/services'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );
  });
});
