import type { User } from '@prisma/client';
import type { CurrentUser, IsoTimestamp, Uuid } from '@nest/types';

/**
 * Maps a database row to its API representation.
 *
 * Explicit field-by-field mapping rather than a spread: a spread would silently
 * publish any column added later, which is how internal fields leak into
 * responses.
 */
export function toCurrentUser(user: User): CurrentUser {
  return {
    id: user.id as Uuid,
    phone: user.phone,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString() as IsoTimestamp,
    updatedAt: user.updatedAt.toISOString() as IsoTimestamp,
  };
}
