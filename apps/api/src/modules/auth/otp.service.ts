import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { OTP_CODE_LENGTH } from '@nest/types';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OtpExpiredException,
  OtpInvalidException,
  OtpMaxAttemptsException,
} from './auth.exceptions';

/**
 * Phone-verification challenges.
 *
 * Security properties, each load-bearing:
 *
 *   * The code is generated with `randomInt`, a CSPRNG. `Math.random` is
 *     predictable and would make codes guessable.
 *   * Only an HMAC of the code is stored, keyed with a server-side pepper. A bare
 *     SHA-256 of six digits is reversible by brute force in microseconds from a
 *     database dump; the pepper makes the digest useless without the key.
 *   * Comparison is timing-safe.
 *   * Attempts are counted in PostgreSQL, not Redis. A Redis eviction would reset
 *     the counter and reopen brute force against a million-value keyspace.
 *   * Issuing a new code consumes any earlier one, so exactly one code is live per
 *     phone number at a time.
 *   * Consumption is a conditional update, so a code cannot be redeemed twice by
 *     two concurrent requests.
 */

export interface IssuedOtp {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Generates a numeric code of exactly OTP_CODE_LENGTH digits.
   *
   * The range is padded rather than restricted so that codes beginning with zero
   * remain possible — excluding them would shrink the keyspace tenfold.
   */
  generateCode(): string {
    const max = 10 ** OTP_CODE_LENGTH;

    return String(randomInt(0, max)).padStart(OTP_CODE_LENGTH, '0');
  }

  hashCode(code: string): string {
    return createHmac('sha256', this.config.otpHashPepper).update(code).digest('hex');
  }

  /** Issues a challenge, invalidating any code previously sent to this number. */
  async issue(phone: string, now: Date = new Date()): Promise<IssuedOtp> {
    const code = this.generateCode();
    const expiresAt = new Date(now.getTime() + this.config.otpTtlSeconds * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.otpChallenge.updateMany({
        where: { phone, consumedAt: null },
        data: { consumedAt: now },
      });

      await tx.otpChallenge.create({
        data: { phone, codeHash: this.hashCode(code), expiresAt },
      });
    });

    return { code, expiresAt };
  }

  /**
   * Verifies a submitted code and consumes the challenge.
   *
   * @throws OtpExpiredException when there is no live challenge for the number.
   * @throws OtpMaxAttemptsException when the attempt ceiling is reached.
   * @throws OtpInvalidException when the code does not match.
   */
  async verify(phone: string, code: string, now: Date = new Date()): Promise<void> {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (challenge === null || challenge.expiresAt.getTime() <= now.getTime()) {
      throw new OtpExpiredException();
    }

    if (challenge.attemptCount >= this.config.otpMaxAttempts) {
      // Burn the challenge so further guessing needs a fresh code, which is
      // itself rate limited.
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: now },
      });

      throw new OtpMaxAttemptsException();
    }

    if (!this.matches(code, challenge.codeHash)) {
      // `increment` pushes the arithmetic into SQL, so concurrent wrong guesses
      // cannot both read the same count and overwrite each other.
      const updated = await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attemptCount: { increment: 1 } },
      });

      if (updated.attemptCount >= this.config.otpMaxAttempts) {
        await this.prisma.otpChallenge.update({
          where: { id: challenge.id },
          data: { consumedAt: now },
        });

        throw new OtpMaxAttemptsException();
      }

      throw new OtpInvalidException();
    }

    // Conditional on still being unconsumed: if two requests submit the correct
    // code simultaneously, exactly one wins.
    const consumed = await this.prisma.otpChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null },
      data: { consumedAt: now },
    });

    if (consumed.count !== 1) {
      throw new OtpExpiredException();
    }
  }

  /** Removes challenges past their expiry. Intended for a scheduled job. */
  async purgeExpired(now: Date = new Date()): Promise<number> {
    const result = await this.prisma.otpChallenge.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    return result.count;
  }

  private matches(code: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashCode(code), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');

    // Equal lengths are guaranteed by construction (both SHA-256), but
    // timingSafeEqual throws on a mismatch, so this stays defensive.
    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  }
}
