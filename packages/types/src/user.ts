import type { IsoTimestamp, Uuid } from './primitives';

/**
 * User identity and profile.
 *
 * Role and status values are not enumerated in 05_DATABASE.md; these were agreed
 * explicitly before implementation.
 */

export const USER_ROLES = ['CUSTOMER', 'PROFESSIONAL', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

/**
 * A user as returned to that same user.
 *
 * `phone` is included because this is the caller's own profile. It must NOT
 * appear in any representation of a *different* user — 02_PRD.md requires
 * minimising exposure of sensitive personal data.
 *
 * Profile fields are nullable: an account exists as soon as a phone number is
 * verified, before the person has told us anything else.
 */
export interface CurrentUser {
  id: Uuid;
  phone: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
