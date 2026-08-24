import { HttpStatus, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ERROR_CODES, type UserRole } from '@nest/types';
import { ApiException } from '../../../common/errors/api-exception';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';

/**
 * Raised when an authenticated caller lacks the required role.
 *
 * 403, not 404: unlike an object the caller does not own, the existence of an
 * admin endpoint is not a secret, and a misleading 404 would make legitimate
 * permission problems hard to diagnose.
 */
export class InsufficientRoleException extends ApiException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      ADMIN_ERROR_CODES.INSUFFICIENT_ROLE,
      'You do not have permission to perform this action.',
    );
  }
}

/**
 * Enforces `@Roles()`.
 *
 * Runs after `AccessTokenGuard`, so `request.user` is already populated with a
 * freshly-read row — the role checked here is the current one, not whatever was
 * true when the token was issued.
 *
 * A route with no `@Roles()` metadata passes through: authentication is the
 * global default, authorization is opt-in per route.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (required === undefined || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (user === undefined) {
      // A @Roles() route that is also @Public() — a wiring mistake. Refuse rather
      // than fall open.
      throw new InsufficientRoleException();
    }

    if (!required.includes(user.role)) {
      throw new InsufficientRoleException();
    }

    return true;
  }
}
