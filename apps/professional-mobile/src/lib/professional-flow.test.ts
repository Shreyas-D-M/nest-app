import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listProfessionalJobs,
  acceptJob,
  declineJob,
  markJobArrived,
  startJob,
  proposeExtraWork,
  completeJob,
  getProfessionalProfile,
  setProfessionalStatus,
} from './api';
import * as authStore from './auth-store';

describe('Professional Mobile Workflow & API Client', () => {
  const mockSession = {
    tokens: {
      tokenType: 'Bearer' as const,
      accessToken: 'mock-pro-access-token',
      expiresInSeconds: 900,
      refreshToken: 'mock-pro-refresh-token',
      refreshExpiresInSeconds: 2592000,
    },
    user: {
      id: 'pro-user-123',
      phone: '+919876543211',
      email: null,
      name: 'Ramesh Kumar',
      avatarUrl: null,
      role: 'PROFESSIONAL' as const,
      status: 'ACTIVE' as const,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
    expiresAt: Date.now() + 900000,
  } as unknown as authStore.StoredAuthSession;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authStore, 'getStoredSession').mockResolvedValue(mockSession);
  });

  it('lists professional jobs from /api/v1/bookings/professional/jobs', async () => {
    const mockJobsResponse = {
      data: [
        {
          id: 'job-101',
          status: 'REQUESTED' as const,
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          service: { id: 's-1', name: 'AC Repair', categoryName: 'Appliance' },
          customer: { id: 'c-1', name: 'John Doe', phone: '+919876543210' },
          address: { id: 'a-1', label: 'Home', addressLine: '123 Main St', locality: 'Sadashiv Nagar', city: 'Belagavi' },
          estimatedAmountMinor: 49900,
          finalAmountMinor: null,
          items: [],
          extraWorkRequests: [],
        },
      ],
      total: 1,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockJobsResponse,
    });

    const result = await listProfessionalJobs();
    expect(result).toEqual(mockJobsResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/bookings/professional/jobs'),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });

  it('accepts an assigned job via POST /bookings/professional/jobs/:id/accept', async () => {
    const mockJobView = {
      id: 'job-101',
      status: 'ACCEPTED' as const,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockJobView,
    });

    const result = await acceptJob('job-101', 30);
    expect(result).toEqual(mockJobView);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/bookings/professional/jobs/job-101/accept'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ estimatedMinutes: 30 }),
      }),
    );
  });

  it('declines a job via POST /bookings/professional/jobs/:id/decline', async () => {
    const mockJobView = {
      id: 'job-101',
      status: 'CANCELLED_BY_PROFESSIONAL' as const,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockJobView,
    });

    const result = await declineJob('job-101', 'Schedule conflict');
    expect(result).toEqual(mockJobView);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/bookings/professional/jobs/job-101/decline'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ reason: 'Schedule conflict' }),
      }),
    );
  });

  it('marks arrived at customer doorstep via POST /bookings/professional/jobs/:id/arrived', async () => {
    const mockJobView = {
      id: 'job-101',
      status: 'ARRIVED' as const,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockJobView,
    });

    const result = await markJobArrived('job-101');
    expect(result).toEqual(mockJobView);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/bookings/professional/jobs/job-101/arrived'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('starts service execution via POST /bookings/professional/jobs/:id/start', async () => {
    const mockJobView = {
      id: 'job-101',
      status: 'IN_PROGRESS' as const,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockJobView,
    });

    const result = await startJob('job-101');
    expect(result).toEqual(mockJobView);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/bookings/professional/jobs/job-101/start'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('proposes extra work quote via POST /bookings/professional/jobs/:id/extra-work', async () => {
    const mockJobView = {
      id: 'job-101',
      status: 'EXTRA_APPROVAL_PENDING' as const,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockJobView,
    });

    const result = await proposeExtraWork('job-101', {
      description: 'Capacitor replacement',
      amountMinor: 35000,
    });
    expect(result).toEqual(mockJobView);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/bookings/professional/jobs/job-101/extra-work'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          description: 'Capacitor replacement',
          amountMinor: 35000,
          evidenceUrls: [],
        }),
      }),
    );
  });

  it('completes service via POST /bookings/professional/jobs/:id/complete', async () => {
    const mockJobView = {
      id: 'job-101',
      status: 'COMPLETED' as const,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockJobView,
    });

    const result = await completeJob('job-101');
    expect(result).toEqual(mockJobView);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/bookings/professional/jobs/job-101/complete'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updates online status via POST /professional/status', async () => {
    const mockProfile = {
      id: 'pro-1',
      businessName: 'Ramesh AC Repairs',
      onlineStatus: 'ONLINE',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockProfile,
    });

    const result = await setProfessionalStatus('ONLINE');
    expect(result).toEqual(mockProfile);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/professional/status'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ onlineStatus: 'ONLINE' }),
      }),
    );
  });

  it('fetches professional profile via GET /professional/profile', async () => {
    const mockProfile = {
      id: 'pro-1',
      businessName: 'Ramesh AC Repairs',
      yearsExperience: 5,
      verificationStatus: 'VERIFIED',
      onlineStatus: 'ONLINE',
      completedJobs: 12,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockProfile,
    });

    const result = await getProfessionalProfile();
    expect(result).toEqual(mockProfile);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/professional/profile'),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });
});
