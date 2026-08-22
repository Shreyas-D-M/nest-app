import { JwtService } from '@nestjs/jwt';
import type { AppConfigService } from '../../config/app-config.service';
import { AccessTokenService } from './access-token.service';
import { AccessTokenExpiredException, AccessTokenInvalidException } from './auth.exceptions';

const SECRET = 'unit-test-signing-secret-000000000000000';

function buildService(overrides: Partial<AppConfigService> = {}): AccessTokenService {
  const config = {
    jwtSecret: SECRET,
    accessTokenTtlSeconds: 900,
    ...overrides,
  } as AppConfigService;

  return new AccessTokenService(new JwtService({}), config);
}

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';

describe('AccessTokenService', () => {
  it('round-trips the subject and session id', () => {
    const service = buildService();

    const claims = service.verify(service.sign(USER_ID, SESSION_ID));

    expect(claims.sub).toBe(USER_ID);
    expect(claims.sid).toBe(SESSION_ID);
  });

  it('does not embed role or status, which would outlive a change to either', () => {
    const service = buildService();
    const token = service.sign(USER_ID, SESSION_ID);

    const payload = JSON.parse(
      Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as Record<string, unknown>;

    expect(payload).not.toHaveProperty('role');
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('phone');
  });

  it('rejects a token signed with a different secret', () => {
    const issuer = buildService({ jwtSecret: 'a-completely-different-secret-00000000' });
    const verifier = buildService();

    expect(() => verifier.verify(issuer.sign(USER_ID, SESSION_ID))).toThrow(
      AccessTokenInvalidException,
    );
  });

  it('rejects a tampered payload', () => {
    const service = buildService();
    const [header, , signature] = service.sign(USER_ID, SESSION_ID).split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'attacker', sid: SESSION_ID })).toString(
      'base64url',
    );

    expect(() => service.verify(`${header}.${forged}.${signature}`)).toThrow(
      AccessTokenInvalidException,
    );
  });

  it('distinguishes an expired token so the client knows to refresh', () => {
    const service = buildService({ accessTokenTtlSeconds: 60 });
    const token = service.sign(USER_ID, SESSION_ID);

    // Move the clock past the token's expiry.
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000);

    try {
      expect(() => service.verify(token)).toThrow(AccessTokenExpiredException);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('rejects structurally invalid tokens', () => {
    const service = buildService();

    expect(() => service.verify('not-a-token')).toThrow(AccessTokenInvalidException);
    expect(() => service.verify('')).toThrow(AccessTokenInvalidException);
  });
});
