import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { UsersService } from '../../users/users.service';
import type { AccessTokenService } from '../access-token.service';
import { AccessTokenInvalidException, AccountSuspendedException } from '../auth.exceptions';
import { AccessTokenGuard } from './access-token.guard';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';

const activeUser = { id: USER_ID, status: 'ACTIVE' } as User;

interface Harness {
  guard: AccessTokenGuard;
  users: { findById: jest.Mock };
  accessTokens: { verify: jest.Mock };
  request: { headers: Record<string, string | undefined>; user?: User };
  context: ExecutionContext;
}

function buildHarness(isPublic = false): Harness {
  const request: Harness['request'] = { headers: {} };

  const context = {
    getHandler: () => (): void => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic ? true : undefined);

  const accessTokens = { verify: jest.fn().mockReturnValue({ sub: USER_ID, sid: SESSION_ID }) };
  const users = { findById: jest.fn().mockResolvedValue(activeUser) };

  const guard = new AccessTokenGuard(
    reflector,
    accessTokens as unknown as AccessTokenService,
    users as unknown as UsersService,
  );

  return { guard, users, accessTokens, request, context };
}

describe('AccessTokenGuard', () => {
  it('lets a @Public() route through without a token', async () => {
    const { guard, context, accessTokens } = buildHarness(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(accessTokens.verify).not.toHaveBeenCalled();
  });

  it('authenticates a valid bearer token and attaches the user', async () => {
    const { guard, context, request } = buildHarness();
    request.headers['authorization'] = 'Bearer valid-token';

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBe(activeUser);
  });

  it('re-reads the user on every request rather than trusting the token', async () => {
    const { guard, context, request, users } = buildHarness();
    request.headers['authorization'] = 'Bearer valid-token';

    await guard.canActivate(context);

    // This lookup is what makes a suspension take effect immediately instead of
    // at token expiry.
    expect(users.findById).toHaveBeenCalledWith(USER_ID);
  });

  it('rejects a request with no Authorization header', async () => {
    const { guard, context } = buildHarness();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(AccessTokenInvalidException);
  });

  it.each([
    ['wrong scheme', 'Basic dXNlcjpwYXNz'],
    ['missing token', 'Bearer'],
    ['empty token', 'Bearer '],
    ['extra content', 'Bearer token extra'],
    ['bare token', 'just-a-token'],
    ['lowercase scheme', 'bearer valid-token'],
  ])('rejects a malformed Authorization header (%s)', async (_label, header) => {
    const { guard, context, request } = buildHarness();
    request.headers['authorization'] = header;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(AccessTokenInvalidException);
  });

  it('rejects a token whose subject no longer exists', async () => {
    const { guard, context, request, users } = buildHarness();
    request.headers['authorization'] = 'Bearer valid-token';
    users.findById.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(AccessTokenInvalidException);
  });

  it('refuses a suspended account even with a valid token', async () => {
    const { guard, context, request, users } = buildHarness();
    request.headers['authorization'] = 'Bearer valid-token';
    users.findById.mockResolvedValue({ id: USER_ID, status: 'SUSPENDED' } as User);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(AccountSuspendedException);
  });

  it('refuses a deleted account', async () => {
    const { guard, context, request, users } = buildHarness();
    request.headers['authorization'] = 'Bearer valid-token';
    users.findById.mockResolvedValue({ id: USER_ID, status: 'DELETED' } as User);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(AccountSuspendedException);
  });

  it('does not attach a user when authentication fails', async () => {
    const { guard, context, request, users } = buildHarness();
    request.headers['authorization'] = 'Bearer valid-token';
    users.findById.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow();
    expect(request.user).toBeUndefined();
  });
});
