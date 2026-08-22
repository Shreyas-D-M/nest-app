import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshTokenInvalidException } from './auth.exceptions';

/**
 * Refresh-token sessions.
 *
 * Refresh tokens are opaque random strings, not JWTs: they must be revocable, and
 * revocation requires server-side state anyway.
 *
 * **Rotation with reuse detection.** Every refresh issues a new token and retires
 * the old one. If a retired token is presented again, either the client is
 * retrying badly or a token was stolen and both parties are using it. The two are
 * indistinguishable from here, so the entire token family is revoked — the
 * standard, deliberately conservative response.
 *
 * Only the SHA-256 of each token is stored. A plain digest is sufficient here
 * (unlike for the six-digit OTP): the token is 48 random bytes, so there is no
 * keyspace to brute force.
 */

/** 48 bytes → 64 base64url characters. */
const REFRESH_TOKEN_BYTES = 48;

const USER_AGENT_MAX_LENGTH = 255;

export interface IssuedSession {
  sessionId: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface RotatedSession extends IssuedSession {
  userId: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Starts a new session family — used at sign-in. */
  async create(userId: string, userAgent?: string, now: Date = new Date()): Promise<IssuedSession> {
    const refreshToken = generateRefreshToken();
    const expiresAt = this.expiryFrom(now);

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
        familyId: randomUUID(),
        expiresAt,
        userAgent: truncateUserAgent(userAgent),
      },
    });

    return { sessionId: session.id, refreshToken, expiresAt };
  }

  /**
   * Exchanges a refresh token for a fresh one.
   *
   * @throws RefreshTokenInvalidException when the token is unknown, expired, or
   * already rotated. Replay additionally revokes the whole family.
   */
  async rotate(
    refreshToken: string,
    userAgent?: string,
    now: Date = new Date(),
  ): Promise<RotatedSession> {
    const existing = await this.prisma.session.findUnique({
      where: { refreshTokenHash: this.hashToken(refreshToken) },
    });

    if (existing === null) {
      throw new RefreshTokenInvalidException();
    }

    if (existing.revokedAt !== null) {
      // Presenting a retired token means the token leaked, or the client is
      // replaying. Revoke everything derived from the same sign-in.
      this.logger.warn(
        `Refresh token replay detected for session family ${existing.familyId}; revoking family`,
      );

      await this.revokeFamily(existing.familyId, now);

      throw new RefreshTokenInvalidException();
    }

    if (existing.expiresAt.getTime() <= now.getTime()) {
      throw new RefreshTokenInvalidException();
    }

    const nextToken = generateRefreshToken();
    const expiresAt = this.expiryFrom(now);

    // One transaction, so a crash mid-rotation cannot leave both tokens live or
    // both dead.
    const created = await this.prisma.$transaction(async (tx) => {
      const next = await tx.session.create({
        data: {
          userId: existing.userId,
          refreshTokenHash: this.hashToken(nextToken),
          familyId: existing.familyId,
          expiresAt,
          userAgent: truncateUserAgent(userAgent) ?? existing.userAgent,
        },
      });

      // Guarded on still being unrevoked: two simultaneous rotations of the same
      // token must not both succeed.
      const retired = await tx.session.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: now, replacedById: next.id },
      });

      if (retired.count !== 1) {
        throw new RefreshTokenInvalidException();
      }

      return next;
    });

    return {
      sessionId: created.id,
      userId: existing.userId,
      refreshToken: nextToken,
      expiresAt,
    };
  }

  /**
   * Revokes the session behind a refresh token.
   *
   * Unknown or already-revoked tokens are silently accepted: logout must be
   * idempotent, and reporting "no such session" would confirm which tokens exist.
   */
  async revoke(refreshToken: string, now: Date = new Date()): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: now },
    });
  }

  async revokeFamily(familyId: string, now: Date = new Date()): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now },
    });

    return result.count;
  }

  /** Revokes every live session for a user — for suspension or "sign out everywhere". */
  async revokeAllForUser(userId: string, now: Date = new Date()): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });

    return result.count;
  }

  /** Deletes expired sessions. Intended for a scheduled job. */
  async purgeExpired(now: Date = new Date()): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    return result.count;
  }

  private expiryFrom(now: Date): Date {
    return new Date(now.getTime() + this.config.refreshTokenTtlSeconds * 1000);
  }
}

function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

/**
 * User agents are attacker-controlled and unbounded. Truncating keeps the column
 * within its width instead of failing the insert on a hostile header.
 */
function truncateUserAgent(userAgent?: string): string | undefined {
  if (userAgent === undefined || userAgent.trim() === '') {
    return undefined;
  }

  return userAgent.slice(0, USER_AGENT_MAX_LENGTH);
}
