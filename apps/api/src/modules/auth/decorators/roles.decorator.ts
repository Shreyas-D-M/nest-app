import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import type { UserRole } from '@nest/types';

/**
 * Restricts a route to specific roles.
 *
 * Used with `RolesGuard`, which is registered globally. A route with no `@Roles()`
 * is reachable by any authenticated user; a route with it additionally requires
 * one of the listed roles.
 *
 * Roles are coarse. Object-level authorization — "is this *your* professional
 * record?" — is always enforced in the query, never by role alone.
 */
export const ROLES_KEY = 'nest:roles';

export const Roles = (...roles: UserRole[]): CustomDecorator<string> =>
  SetMetadata(ROLES_KEY, roles);
