import type { AppConfigService } from '../../config/app-config.service';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  OtpExpiredException,
  OtpInvalidException,
  OtpMaxAttemptsException,
} from './auth.exceptions';
import { OtpService } from './otp.service';

const PEPPER = 'unit-test-otp-pepper-0000000000000000000';
const PHONE = '+919876543210';
const NOW = new Date('2026-08-22T10:00:00.000Z');
const TTL_SECONDS = 300;
const MAX_ATTEMPTS = 5;

interface ChallengeDelegate {
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  deleteMany: jest.Mock;
}

function buildService(): {
  service: OtpService;
  challenges: ChallengeDelegate;
  txChallenges: ChallengeDelegate;
} {
  const challenges: ChallengeDelegate = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  const txChallenges: ChallengeDelegate = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  const prisma = {
    otpChallenge: challenges,
    $transaction: (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ otpChallenge: txChallenges }),
  } as unknown as PrismaService;

  const config = {
    otpHashPepper: PEPPER,
    otpTtlSeconds: TTL_SECONDS,
    otpMaxAttempts: MAX_ATTEMPTS,
  } as AppConfigService;

  return { service: new OtpService(prisma, config), challenges, txChallenges };
}

/** A live, unconsumed challenge for `code`. */
function liveChallenge(service: OtpService, code: string, overrides: Record<string, unknown> = {}) {
  return {
    id: 'challenge-1',
    phone: PHONE,
    codeHash: service.hashCode(code),
    expiresAt: new Date(NOW.getTime() + TTL_SECONDS * 1000),
    attemptCount: 0,
    consumedAt: null,
    ...overrides,
  };
}

describe('OtpService', () => {
  describe('generateCode', () => {
    it('always produces exactly six digits', () => {
      const { service } = buildService();

      for (let i = 0; i < 200; i += 1) {
        expect(service.generateCode()).toMatch(/^\d{6}$/);
      }
    });

    it('can produce codes with leading zeros, keeping the full keyspace', () => {
      const { service } = buildService();
      const codes = Array.from({ length: 400 }, () => service.generateCode());

      // With 400 draws, seeing no leading-zero code would mean the range was
      // restricted — a tenfold reduction in keyspace.
      expect(codes.some((code) => code.startsWith('0'))).toBe(true);
    });
  });

  describe('hashCode', () => {
    it('is deterministic', () => {
      const { service } = buildService();

      expect(service.hashCode('123456')).toBe(service.hashCode('123456'));
    });

    it('never returns the code itself', () => {
      const { service } = buildService();

      expect(service.hashCode('123456')).not.toContain('123456');
      expect(service.hashCode('123456')).toHaveLength(64);
    });

    it('depends on the pepper, so a stolen digest is useless without it', () => {
      const { service } = buildService();
      const otherPrisma = {} as unknown as PrismaService;
      const otherService = new OtpService(otherPrisma, {
        otpHashPepper: 'a-different-pepper-000000000000000000000',
        otpTtlSeconds: TTL_SECONDS,
        otpMaxAttempts: MAX_ATTEMPTS,
      } as AppConfigService);

      expect(service.hashCode('123456')).not.toBe(otherService.hashCode('123456'));
    });
  });

  describe('issue', () => {
    it('stores only the hash, never the code', async () => {
      const { service, txChallenges } = buildService();
      txChallenges.updateMany.mockResolvedValue({ count: 0 });
      txChallenges.create.mockResolvedValue({});

      const { code } = await service.issue(PHONE, NOW);

      const created = txChallenges.create.mock.calls[0][0].data;
      expect(created.codeHash).toBe(service.hashCode(code));
      expect(JSON.stringify(created)).not.toContain(code);
    });

    it('consumes any earlier live challenge, so only one code works at a time', async () => {
      const { service, txChallenges } = buildService();
      txChallenges.updateMany.mockResolvedValue({ count: 1 });
      txChallenges.create.mockResolvedValue({});

      await service.issue(PHONE, NOW);

      expect(txChallenges.updateMany).toHaveBeenCalledWith({
        where: { phone: PHONE, consumedAt: null },
        data: { consumedAt: NOW },
      });
    });

    it('sets the expiry from the configured TTL', async () => {
      const { service, txChallenges } = buildService();
      txChallenges.updateMany.mockResolvedValue({ count: 0 });
      txChallenges.create.mockResolvedValue({});

      const { expiresAt } = await service.issue(PHONE, NOW);

      expect(expiresAt.getTime()).toBe(NOW.getTime() + TTL_SECONDS * 1000);
    });
  });

  describe('verify', () => {
    it('accepts the correct code and consumes the challenge', async () => {
      const { service, challenges } = buildService();
      const code = '123456';
      challenges.findFirst.mockResolvedValue(liveChallenge(service, code));
      challenges.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.verify(PHONE, code, NOW)).resolves.toBeUndefined();

      expect(challenges.updateMany).toHaveBeenCalledWith({
        where: { id: 'challenge-1', consumedAt: null },
        data: { consumedAt: NOW },
      });
    });

    it('rejects when no live challenge exists', async () => {
      const { service, challenges } = buildService();
      challenges.findFirst.mockResolvedValue(null);

      await expect(service.verify(PHONE, '123456', NOW)).rejects.toBeInstanceOf(
        OtpExpiredException,
      );
    });

    it('rejects an expired challenge', async () => {
      const { service, challenges } = buildService();
      const code = '123456';
      challenges.findFirst.mockResolvedValue(
        liveChallenge(service, code, { expiresAt: new Date(NOW.getTime() - 1) }),
      );

      await expect(service.verify(PHONE, code, NOW)).rejects.toBeInstanceOf(OtpExpiredException);
    });

    it('rejects a wrong code and counts the attempt in SQL', async () => {
      const { service, challenges } = buildService();
      challenges.findFirst.mockResolvedValue(liveChallenge(service, '123456'));
      challenges.update.mockResolvedValue({ attemptCount: 1 });

      await expect(service.verify(PHONE, '999999', NOW)).rejects.toBeInstanceOf(
        OtpInvalidException,
      );

      expect(challenges.update).toHaveBeenCalledWith({
        where: { id: 'challenge-1' },
        data: { attemptCount: { increment: 1 } },
      });
    });

    it('refuses further guesses once the ceiling is already reached', async () => {
      const { service, challenges } = buildService();
      challenges.findFirst.mockResolvedValue(
        liveChallenge(service, '123456', { attemptCount: MAX_ATTEMPTS }),
      );
      challenges.update.mockResolvedValue({});

      await expect(service.verify(PHONE, '123456', NOW)).rejects.toBeInstanceOf(
        OtpMaxAttemptsException,
      );

      // The challenge is burned, so continued guessing needs a fresh — rate
      // limited — code.
      expect(challenges.update).toHaveBeenCalledWith({
        where: { id: 'challenge-1' },
        data: { consumedAt: NOW },
      });
    });

    it('burns the challenge on the guess that reaches the ceiling', async () => {
      const { service, challenges } = buildService();
      challenges.findFirst.mockResolvedValue(
        liveChallenge(service, '123456', { attemptCount: MAX_ATTEMPTS - 1 }),
      );
      challenges.update
        .mockResolvedValueOnce({ attemptCount: MAX_ATTEMPTS })
        .mockResolvedValueOnce({});

      await expect(service.verify(PHONE, '999999', NOW)).rejects.toBeInstanceOf(
        OtpMaxAttemptsException,
      );

      expect(challenges.update).toHaveBeenLastCalledWith({
        where: { id: 'challenge-1' },
        data: { consumedAt: NOW },
      });
    });

    it('treats a lost consumption race as expired, so a code is single-use', async () => {
      const { service, challenges } = buildService();
      const code = '123456';
      challenges.findFirst.mockResolvedValue(liveChallenge(service, code));
      // A concurrent request consumed it first.
      challenges.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.verify(PHONE, code, NOW)).rejects.toBeInstanceOf(OtpExpiredException);
    });

    it('only considers unconsumed challenges, newest first', async () => {
      const { service, challenges } = buildService();
      challenges.findFirst.mockResolvedValue(liveChallenge(service, '123456'));
      challenges.updateMany.mockResolvedValue({ count: 1 });

      await service.verify(PHONE, '123456', NOW);

      expect(challenges.findFirst).toHaveBeenCalledWith({
        where: { phone: PHONE, consumedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('purgeExpired', () => {
    it('deletes challenges past their expiry', async () => {
      const { service, challenges } = buildService();
      challenges.deleteMany.mockResolvedValue({ count: 3 });

      await expect(service.purgeExpired(NOW)).resolves.toBe(3);
      expect(challenges.deleteMany).toHaveBeenCalledWith({ where: { expiresAt: { lt: NOW } } });
    });
  });
});
