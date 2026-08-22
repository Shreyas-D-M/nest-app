import { createHash } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { canonicalJson } from './canonical-json';
import {
  IdempotencyKeyConflictException,
  IdempotentRequestInProgressException,
} from './idempotency.exceptions';

/**
 * Durable idempotency for commands that must not execute twice — booking
 * creation and payments above all (CLAUDE.md).
 *
 * The record lives in PostgreSQL rather than Redis on purpose: Redis may evict a
 * key or lose its dataset, and a lost idempotency record means a duplicate
 * booking or a double charge.
 *
 * Atomicity comes from the `(scope, key)` unique constraint. Two concurrent
 * requests both attempt the insert; the database picks exactly one winner, so no
 * application-level lock is required.
 *
 * No HTTP interceptor is provided yet. How a command's response is captured and
 * replayed depends on the shape of the first command to need it (bookings), and
 * committing to that shape now would mean guessing. This service is the durable
 * part, and it is complete and tested.
 */

export const DEFAULT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/** JSON-compatible value, mirroring what the `response_body` column can hold. */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type IdempotencyOutcome =
  { outcome: 'started' } | { outcome: 'replay'; responseCode: number; responseBody: JsonValue };

export interface BeginParams {
  /** Logical command namespace, e.g. `bookings.create`. */
  scope: string;
  /** Client-supplied key from the `Idempotency-Key` header. */
  key: string;
  /** Request payload; hashed to detect key reuse with different content. */
  payload: unknown;
  ttlMs?: number;
  /** Injectable clock, for tests. */
  now?: Date;
}

export interface CompleteParams {
  scope: string;
  key: string;
  responseCode: number;
  responseBody: JsonValue;
  now?: Date;
}

function isUniqueConstraintViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const { code } = error as { code: unknown };

  return code === 'P2002';
}

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  hashPayload(payload: unknown): string {
    return createHash('sha256').update(canonicalJson(payload)).digest('hex');
  }

  /**
   * Claims the key for this request.
   *
   * Returns `started` when the caller owns the command and should execute it, or
   * `replay` with the stored response when the command already completed.
   *
   * @throws IdempotencyKeyConflictException when the key was used with a
   * different payload.
   * @throws IdempotentRequestInProgressException when an identical request is
   * still running.
   */
  async begin(params: BeginParams): Promise<IdempotencyOutcome> {
    const { scope, key, payload } = params;
    const ttlMs = params.ttlMs ?? DEFAULT_IDEMPOTENCY_TTL_MS;
    const now = params.now ?? new Date();
    const requestHash = this.hashPayload(payload);
    const expiresAt = new Date(now.getTime() + ttlMs);

    try {
      await this.prisma.idempotencyKey.create({
        data: { scope, key, requestHash, status: 'IN_PROGRESS', expiresAt },
      });

      return { outcome: 'started' };
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }
    }

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { scope_key: { scope, key } },
    });

    if (existing === null) {
      // The row was removed between the failed insert and this read — a
      // concurrent purge. Ask the caller to retry rather than guessing.
      throw new IdempotentRequestInProgressException();
    }

    if (existing.expiresAt.getTime() <= now.getTime()) {
      // The guarantee window has passed, so the key may be reused. Reset the
      // record rather than leaving a stale response to be replayed.
      await this.prisma.idempotencyKey.update({
        where: { id: existing.id },
        data: {
          requestHash,
          status: 'IN_PROGRESS',
          responseCode: null,
          responseBody: Prisma.DbNull,
          completedAt: null,
          expiresAt,
        },
      });

      return { outcome: 'started' };
    }

    if (existing.requestHash !== requestHash) {
      throw new IdempotencyKeyConflictException();
    }

    if (existing.status === 'IN_PROGRESS') {
      throw new IdempotentRequestInProgressException();
    }

    return {
      outcome: 'replay',
      responseCode: existing.responseCode ?? HttpStatus.OK,
      responseBody: (existing.responseBody ?? null) as JsonValue,
    };
  }

  /** Stores the response so that a later replay returns the same result. */
  async complete(params: CompleteParams): Promise<void> {
    const { scope, key, responseCode, responseBody } = params;

    await this.prisma.idempotencyKey.update({
      where: { scope_key: { scope, key } },
      data: {
        status: 'COMPLETED',
        responseCode,
        // A JSON `null` body is stored as JSON null, distinct from SQL NULL,
        // which Prisma reserves for "no value".
        responseBody:
          responseBody === null ? Prisma.JsonNull : (responseBody as Prisma.InputJsonValue),
        completedAt: params.now ?? new Date(),
      },
    });
  }

  /**
   * Releases a claim after the command failed, so the client can retry.
   *
   * Only in-progress claims are removed: a completed record must survive to keep
   * its replay guarantee.
   */
  async release(scope: string, key: string): Promise<void> {
    await this.prisma.idempotencyKey.deleteMany({
      where: { scope, key, status: 'IN_PROGRESS' },
    });
  }

  /** Deletes expired records. Intended for a scheduled job. */
  async purgeExpired(now: Date = new Date()): Promise<number> {
    const result = await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    return result.count;
  }
}
