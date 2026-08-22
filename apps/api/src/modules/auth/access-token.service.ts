import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { AccessTokenClaims } from '@nest/types';
import { AppConfigService } from '../../config/app-config.service';
import { AccessTokenExpiredException, AccessTokenInvalidException } from './auth.exceptions';

/**
 * Access tokens.
 *
 * Short-lived, signed, and stateless. Claims carry only the user id and the
 * session that minted the token — deliberately no role and no status, because a
 * token cannot be un-issued: embedding authorization state would let a suspended
 * or demoted user keep their old privileges until the token expired. The guard
 * re-reads the user on every request instead.
 */
@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  get ttlSeconds(): number {
    return this.config.accessTokenTtlSeconds;
  }

  sign(userId: string, sessionId: string): string {
    const claims: Pick<AccessTokenClaims, 'sub' | 'sid'> = { sub: userId, sid: sessionId };

    const options: JwtSignOptions = {
      secret: this.config.jwtSecret,
      expiresIn: this.ttlSeconds,
    };

    return this.jwt.sign(claims, options);
  }

  /**
   * @throws AccessTokenExpiredException when the token was valid but has expired,
   * so the client knows to refresh rather than to sign in again.
   * @throws AccessTokenInvalidException for anything else — wrong signature,
   * malformed token, missing claims.
   */
  verify(token: string): AccessTokenClaims {
    let claims: unknown;

    try {
      claims = this.jwt.verify(token, { secret: this.config.jwtSecret });
    } catch (error) {
      if (isTokenExpiredError(error)) {
        throw new AccessTokenExpiredException();
      }

      throw new AccessTokenInvalidException();
    }

    if (!hasRequiredClaims(claims)) {
      throw new AccessTokenInvalidException();
    }

    return claims;
  }
}

function isTokenExpiredError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: unknown }).name === 'TokenExpiredError'
  );
}

function hasRequiredClaims(claims: unknown): claims is AccessTokenClaims {
  if (typeof claims !== 'object' || claims === null) {
    return false;
  }

  const { sub, sid } = claims as { sub?: unknown; sid?: unknown };

  return typeof sub === 'string' && sub !== '' && typeof sid === 'string' && sid !== '';
}
