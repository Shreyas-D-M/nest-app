import type { PrismaService } from '../../prisma/prisma.service';
import {
  IdempotencyKeyConflictException,
  IdempotentRequestInProgressException,
} from './idempotency.exceptions';
import { IdempotencyService } from './idempotency.service';

interface DelegateMocks {
  create: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  deleteMany: jest.Mock;
}

/** A unique-constraint violation as Prisma reports it. */
const uniqueViolation = { code: 'P2002' };

const SCOPE = 'bookings.create';
const KEY = 'client-key-1';
const NOW = new Date('2026-08-22T10:00:00.000Z');

function buildService(): { service: IdempotencyService; delegate: DelegateMocks } {
  const delegate: DelegateMocks = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  };

  // The service only touches the idempotencyKey delegate, so a partial double is
  // sufficient and keeps these tests free of a live database.
  const prisma = { idempotencyKey: delegate } as unknown as PrismaService;

  return { service: new IdempotencyService(prisma), delegate };
}

describe('IdempotencyService', () => {
  describe('hashPayload', () => {
    it('is insensitive to key order', () => {
      const { service } = buildService();

      expect(service.hashPayload({ a: 1, b: 2 })).toBe(service.hashPayload({ b: 2, a: 1 }));
    });

    it('changes when the payload changes', () => {
      const { service } = buildService();

      expect(service.hashPayload({ amountMinor: 100 })).not.toBe(
        service.hashPayload({ amountMinor: 200 }),
      );
    });
  });

  describe('begin', () => {
    it('claims the key and reports started on first use', async () => {
      const { service, delegate } = buildService();
      delegate.create.mockResolvedValue({});

      const result = await service.begin({
        scope: SCOPE,
        key: KEY,
        payload: { amountMinor: 100 },
        now: NOW,
      });

      expect(result).toEqual({ outcome: 'started' });
      expect(delegate.create).toHaveBeenCalledTimes(1);
      expect(delegate.create.mock.calls[0][0].data).toMatchObject({
        scope: SCOPE,
        key: KEY,
        status: 'IN_PROGRESS',
      });
    });

    it('replays the stored response when the command already completed', async () => {
      const { service, delegate } = buildService();
      const payload = { amountMinor: 100 };
      delegate.create.mockRejectedValue(uniqueViolation);
      delegate.findUnique.mockResolvedValue({
        id: 'row-1',
        requestHash: service.hashPayload(payload),
        status: 'COMPLETED',
        responseCode: 201,
        responseBody: { bookingId: 'b-1' },
        expiresAt: new Date(NOW.getTime() + 60_000),
      });

      const result = await service.begin({ scope: SCOPE, key: KEY, payload, now: NOW });

      expect(result).toEqual({
        outcome: 'replay',
        responseCode: 201,
        responseBody: { bookingId: 'b-1' },
      });
    });

    it('rejects the same key used with a different payload', async () => {
      const { service, delegate } = buildService();
      delegate.create.mockRejectedValue(uniqueViolation);
      delegate.findUnique.mockResolvedValue({
        id: 'row-1',
        requestHash: service.hashPayload({ amountMinor: 100 }),
        status: 'COMPLETED',
        responseCode: 201,
        responseBody: {},
        expiresAt: new Date(NOW.getTime() + 60_000),
      });

      await expect(
        service.begin({ scope: SCOPE, key: KEY, payload: { amountMinor: 999 }, now: NOW }),
      ).rejects.toBeInstanceOf(IdempotencyKeyConflictException);
    });

    it('rejects a concurrent identical request that is still running', async () => {
      const { service, delegate } = buildService();
      const payload = { amountMinor: 100 };
      delegate.create.mockRejectedValue(uniqueViolation);
      delegate.findUnique.mockResolvedValue({
        id: 'row-1',
        requestHash: service.hashPayload(payload),
        status: 'IN_PROGRESS',
        responseCode: null,
        responseBody: null,
        expiresAt: new Date(NOW.getTime() + 60_000),
      });

      await expect(
        service.begin({ scope: SCOPE, key: KEY, payload, now: NOW }),
      ).rejects.toBeInstanceOf(IdempotentRequestInProgressException);
    });

    it('resets an expired record instead of replaying a stale response', async () => {
      const { service, delegate } = buildService();
      delegate.create.mockRejectedValue(uniqueViolation);
      delegate.findUnique.mockResolvedValue({
        id: 'row-1',
        requestHash: 'some-old-hash',
        status: 'COMPLETED',
        responseCode: 201,
        responseBody: { bookingId: 'stale' },
        expiresAt: new Date(NOW.getTime() - 1),
      });
      delegate.update.mockResolvedValue({});

      const result = await service.begin({
        scope: SCOPE,
        key: KEY,
        payload: { amountMinor: 100 },
        now: NOW,
      });

      expect(result).toEqual({ outcome: 'started' });
      expect(delegate.update).toHaveBeenCalledTimes(1);
      expect(delegate.update.mock.calls[0][0].data).toMatchObject({
        status: 'IN_PROGRESS',
        responseCode: null,
      });
    });

    it('asks the caller to retry when the record vanished mid-flight', async () => {
      const { service, delegate } = buildService();
      delegate.create.mockRejectedValue(uniqueViolation);
      delegate.findUnique.mockResolvedValue(null);

      await expect(
        service.begin({ scope: SCOPE, key: KEY, payload: {}, now: NOW }),
      ).rejects.toBeInstanceOf(IdempotentRequestInProgressException);
    });

    it('propagates errors that are not unique-constraint violations', async () => {
      const { service, delegate } = buildService();
      delegate.create.mockRejectedValue(new Error('connection reset'));

      await expect(service.begin({ scope: SCOPE, key: KEY, payload: {} })).rejects.toThrow(
        'connection reset',
      );
      expect(delegate.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('stores the response for later replay', async () => {
      const { service, delegate } = buildService();
      delegate.update.mockResolvedValue({});

      await service.complete({
        scope: SCOPE,
        key: KEY,
        responseCode: 201,
        responseBody: { bookingId: 'b-1' },
        now: NOW,
      });

      expect(delegate.update.mock.calls[0][0]).toMatchObject({
        where: { scope_key: { scope: SCOPE, key: KEY } },
        data: {
          status: 'COMPLETED',
          responseCode: 201,
          responseBody: { bookingId: 'b-1' },
          completedAt: NOW,
        },
      });
    });
  });

  describe('release', () => {
    it('removes only in-progress claims, preserving completed guarantees', async () => {
      const { service, delegate } = buildService();
      delegate.deleteMany.mockResolvedValue({ count: 1 });

      await service.release(SCOPE, KEY);

      expect(delegate.deleteMany).toHaveBeenCalledWith({
        where: { scope: SCOPE, key: KEY, status: 'IN_PROGRESS' },
      });
    });
  });

  describe('purgeExpired', () => {
    it('deletes records past their expiry and reports the count', async () => {
      const { service, delegate } = buildService();
      delegate.deleteMany.mockResolvedValue({ count: 7 });

      await expect(service.purgeExpired(NOW)).resolves.toBe(7);
      expect(delegate.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: NOW } },
      });
    });
  });
});
