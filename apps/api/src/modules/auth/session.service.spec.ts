import type { AppConfigService } from '../../config/app-config.service';
import type { PrismaService } from '../../prisma/prisma.service';
import { RefreshTokenInvalidException } from './auth.exceptions';
import { SessionService } from './session.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const FAMILY_ID = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-08-22T10:00:00.000Z');
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

interface SessionDelegate {
  create: jest.Mock;
  findUnique: jest.Mock;
  updateMany: jest.Mock;
  deleteMany: jest.Mock;
}

function buildService(): {
  service: SessionService;
  sessions: SessionDelegate;
  txSessions: SessionDelegate;
} {
  const make = (): SessionDelegate => ({
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  });

  const sessions = make();
  const txSessions = make();

  const prisma = {
    session: sessions,
    $transaction: (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ session: txSessions }),
  } as unknown as PrismaService;

  const config = { refreshTokenTtlSeconds: REFRESH_TTL_SECONDS } as AppConfigService;

  return { service: new SessionService(prisma, config), sessions, txSessions };
}

describe('SessionService', () => {
  describe('hashToken', () => {
    it('produces a 64-character digest that is not the token', () => {
      const { service } = buildService();
      const hash = service.hashToken('some-refresh-token');

      expect(hash).toHaveLength(64);
      expect(hash).not.toContain('some-refresh-token');
    });
  });

  describe('create', () => {
    it('stores only the hash of the refresh token', async () => {
      const { service, sessions } = buildService();
      sessions.create.mockResolvedValue({ id: 'session-1' });

      const issued = await service.create(USER_ID, 'jest-agent', NOW);

      const stored = sessions.create.mock.calls[0][0].data;
      expect(stored.refreshTokenHash).toBe(service.hashToken(issued.refreshToken));
      expect(JSON.stringify(stored)).not.toContain(issued.refreshToken);
    });

    it('issues a high-entropy, URL-safe token', async () => {
      const { service, sessions } = buildService();
      sessions.create.mockResolvedValue({ id: 'session-1' });

      const issued = await service.create(USER_ID, undefined, NOW);

      expect(issued.refreshToken).toMatch(/^[A-Za-z0-9_-]{64}$/);
    });

    it('starts a new family and applies the configured TTL', async () => {
      const { service, sessions } = buildService();
      sessions.create.mockResolvedValue({ id: 'session-1' });

      const issued = await service.create(USER_ID, undefined, NOW);
      const stored = sessions.create.mock.calls[0][0].data;

      expect(stored.familyId).toMatch(/^[0-9a-f-]{36}$/);
      expect(issued.expiresAt.getTime()).toBe(NOW.getTime() + REFRESH_TTL_SECONDS * 1000);
    });

    it('truncates a hostile user agent to the column width', async () => {
      const { service, sessions } = buildService();
      sessions.create.mockResolvedValue({ id: 'session-1' });

      await service.create(USER_ID, 'x'.repeat(5000), NOW);

      expect(sessions.create.mock.calls[0][0].data.userAgent).toHaveLength(255);
    });

    it('does not persist an IP address', async () => {
      const { service, sessions } = buildService();
      sessions.create.mockResolvedValue({ id: 'session-1' });

      await service.create(USER_ID, 'agent', NOW);

      expect(Object.keys(sessions.create.mock.calls[0][0].data)).not.toContain('ip');
    });
  });

  describe('rotate', () => {
    const liveRow = {
      id: 'session-1',
      userId: USER_ID,
      familyId: FAMILY_ID,
      revokedAt: null,
      replacedById: null,
      userAgent: 'old-agent',
      expiresAt: new Date(NOW.getTime() + 60_000),
    };

    it('issues a new token and retires the old one', async () => {
      const { service, sessions, txSessions } = buildService();
      sessions.findUnique.mockResolvedValue(liveRow);
      txSessions.create.mockResolvedValue({ id: 'session-2' });
      txSessions.updateMany.mockResolvedValue({ count: 1 });

      const rotated = await service.rotate('old-token', 'new-agent', NOW);

      expect(rotated.userId).toBe(USER_ID);
      expect(rotated.sessionId).toBe('session-2');
      expect(rotated.refreshToken).toMatch(/^[A-Za-z0-9_-]{64}$/);
      expect(rotated.refreshToken).not.toBe('old-token');

      expect(txSessions.updateMany).toHaveBeenCalledWith({
        where: { id: 'session-1', revokedAt: null },
        data: { revokedAt: NOW, replacedById: 'session-2' },
      });
    });

    it('keeps the rotated token in the same family', async () => {
      const { service, sessions, txSessions } = buildService();
      sessions.findUnique.mockResolvedValue(liveRow);
      txSessions.create.mockResolvedValue({ id: 'session-2' });
      txSessions.updateMany.mockResolvedValue({ count: 1 });

      await service.rotate('old-token', undefined, NOW);

      expect(txSessions.create.mock.calls[0][0].data.familyId).toBe(FAMILY_ID);
    });

    it('rejects an unknown token', async () => {
      const { service, sessions } = buildService();
      sessions.findUnique.mockResolvedValue(null);

      await expect(service.rotate('nope', undefined, NOW)).rejects.toBeInstanceOf(
        RefreshTokenInvalidException,
      );
    });

    it('rejects an expired token', async () => {
      const { service, sessions } = buildService();
      sessions.findUnique.mockResolvedValue({
        ...liveRow,
        expiresAt: new Date(NOW.getTime() - 1),
      });

      await expect(service.rotate('stale', undefined, NOW)).rejects.toBeInstanceOf(
        RefreshTokenInvalidException,
      );
    });

    describe('reuse detection', () => {
      it('revokes the whole family when an already-rotated token is replayed', async () => {
        const { service, sessions } = buildService();
        sessions.findUnique.mockResolvedValue({ ...liveRow, revokedAt: NOW });
        sessions.updateMany.mockResolvedValue({ count: 2 });

        await expect(service.rotate('replayed', undefined, NOW)).rejects.toBeInstanceOf(
          RefreshTokenInvalidException,
        );

        // Every live token descended from the same sign-in is killed, because a
        // replay is indistinguishable from theft.
        expect(sessions.updateMany).toHaveBeenCalledWith({
          where: { familyId: FAMILY_ID, revokedAt: null },
          data: { revokedAt: NOW },
        });
      });

      it('does not mint a replacement for a replayed token', async () => {
        const { service, sessions, txSessions } = buildService();
        sessions.findUnique.mockResolvedValue({ ...liveRow, revokedAt: NOW });
        sessions.updateMany.mockResolvedValue({ count: 1 });

        await expect(service.rotate('replayed', undefined, NOW)).rejects.toThrow();

        expect(txSessions.create).not.toHaveBeenCalled();
      });
    });

    it('rejects when a concurrent rotation already retired the token', async () => {
      const { service, sessions, txSessions } = buildService();
      sessions.findUnique.mockResolvedValue(liveRow);
      txSessions.create.mockResolvedValue({ id: 'session-2' });
      // The guarded update matched nothing: another request won the race.
      txSessions.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.rotate('old-token', undefined, NOW)).rejects.toBeInstanceOf(
        RefreshTokenInvalidException,
      );
    });
  });

  describe('revoke', () => {
    it('revokes only a live session, and is idempotent for anything else', async () => {
      const { service, sessions } = buildService();
      sessions.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.revoke('unknown-token', NOW)).resolves.toBeUndefined();

      expect(sessions.updateMany).toHaveBeenCalledWith({
        where: { refreshTokenHash: service.hashToken('unknown-token'), revokedAt: null },
        data: { revokedAt: NOW },
      });
    });
  });

  describe('revokeAllForUser', () => {
    it('kills every live session for the user', async () => {
      const { service, sessions } = buildService();
      sessions.updateMany.mockResolvedValue({ count: 4 });

      await expect(service.revokeAllForUser(USER_ID, NOW)).resolves.toBe(4);
      expect(sessions.updateMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, revokedAt: null },
        data: { revokedAt: NOW },
      });
    });
  });

  describe('purgeExpired', () => {
    it('deletes sessions past their expiry', async () => {
      const { service, sessions } = buildService();
      sessions.deleteMany.mockResolvedValue({ count: 7 });

      await expect(service.purgeExpired(NOW)).resolves.toBe(7);
    });
  });
});
