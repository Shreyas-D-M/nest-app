import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { Request } from 'express';

/**
 * The authenticated user, as attached by the access-token guard.
 *
 * Reading identity from the request rather than from ambient async storage is
 * deliberate: an endpoint's dependence on the caller stays visible in its
 * signature, which makes authorization mistakes easier to spot in review.
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user === undefined) {
      // Unreachable through the guard; a bare assertion would hide the mistake if
      // the guard were ever removed from a route.
      throw new Error('CurrentUser used on a route without the access-token guard');
    }

    return request.user;
  },
);
