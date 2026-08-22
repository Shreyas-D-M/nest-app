import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTHORIZATION_HEADER, BEARER_PREFIX } from '@nest/types';
import { UsersService } from '../../users/users.service';
import { AccessTokenService } from '../access-token.service';
import { AccessTokenInvalidException, AccountSuspendedException } from '../auth.exceptions';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';

/**
 * Authenticates every request that has not opted out with `@Public()`.
 *
 * The user is loaded from the database on each request rather than trusted from
 * the token. That is one indexed primary-key lookup, and it buys correctness that
 * matters: a suspension, a role change or a deletion takes effect on the very next
 * request instead of lingering for the remaining lifetime of an already-issued
 * access token. CLAUDE.md requires the server to be authoritative for permissions,
 * and a token is a snapshot, not an authority.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokens: AccessTokenService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic === true) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers[AUTHORIZATION_HEADER]);

    if (token === null) {
      throw new AccessTokenInvalidException();
    }

    const claims = this.accessTokens.verify(token);
    const user = await this.users.findById(claims.sub);

    if (user === null) {
      // Valid signature, but the subject no longer exists.
      throw new AccessTokenInvalidException();
    }

    if (user.status !== 'ACTIVE') {
      throw new AccountSuspendedException();
    }

    request.user = user;

    return true;
  }
}

function extractBearerToken(header: string | string[] | undefined): string | null {
  const value = Array.isArray(header) ? header[0] : header;

  if (value === undefined) {
    return null;
  }

  const [scheme, token, ...rest] = value.split(' ');

  // Reject anything with trailing content rather than trying to interpret it.
  if (scheme !== BEARER_PREFIX || token === undefined || token === '' || rest.length > 0) {
    return null;
  }

  return token;
}
