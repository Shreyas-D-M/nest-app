import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Audit trail for privileged actions.
 *
 * 06_API_SPEC.md requires admin actions to be audited. Two properties matter:
 *
 *   **Atomicity.** `record` accepts a transaction client, so the audit row and the
 *   change it describes commit together. An audit trail that can disagree with
 *   reality is worse than none, because it is trusted.
 *
 *   **Append-only.** Nothing in the codebase updates or deletes an audit row.
 */

/** Minimal surface shared by PrismaService and a transaction client. */
type AuditWriter = Pick<Prisma.TransactionClient, 'auditLog'>;

export interface AuditEntry {
  /** The acting user, or null for a system action. */
  actorId: string | null;
  /** Dotted action name — use the AUDIT_ACTIONS constants. */
  action: string;
  entityType: string;
  entityId: string;
  /**
   * Relevant state before and after.
   *
   * Record only the fields the action touched. Never a secret, a token, or a
   * document's contents: audit rows are long-lived and widely readable, so
   * anything put here is effectively kept forever.
   */
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Appends an audit row.
   *
   * Pass `tx` from inside a transaction so the entry cannot survive a rolled-back
   * change, or be lost when the change succeeds.
   */
  async record(entry: AuditEntry, tx?: AuditWriter): Promise<void> {
    const client: AuditWriter = tx ?? this.prisma;

    await client.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        beforeJson: toJson(entry.before),
        afterJson: toJson(entry.after),
      },
    });
  }
}

/**
 * Converts an optional snapshot into a Prisma JSON value.
 *
 * Absent and explicit-null both become SQL NULL: for an audit snapshot there is no
 * useful distinction between "no before state" and "before state was nothing".
 */
function toJson(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === undefined || value === null) {
    return Prisma.DbNull;
  }

  return value as Prisma.InputJsonValue;
}
