import type { AppConfigService } from '../../config/app-config.service';
import type { RateLimiterService } from '../../common/rate-limit/rate-limiter.service';
import type { UsersService } from '../users/users.service';
import type { AccessTokenService } from './access-token.service';
import type { OtpService } from './otp.service';
import type { SessionService } from './session.service';
import type { SmsSender } from './sms/sms-sender';
import { RateLimitedException } from './auth.exceptions';
import { AuthService } from './auth.service';

const PHONE = '+919876543210';
const CONTEXT = { ip: '127.0.0.1', userAgent: 'test-agent' };

function buildAuthService(isProduction = false) {
  const otp = {
    issue: jest.fn().mockResolvedValue({ code: '654321', expiresAt: new Date() }),
    verify: jest.fn().mockResolvedValue(undefined),
  } as unknown as OtpService;

  const sessions = {
    create: jest.fn().mockResolvedValue({
      sessionId: 'session-1',
      refreshToken: 'refresh-token-1',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }),
    rotate: jest.fn().mockResolvedValue({
      sessionId: 'session-2',
      refreshToken: 'refresh-token-2',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userId: 'user-1',
    }),
    revoke: jest.fn().mockResolvedValue(undefined),
    revokeAllForUser: jest.fn().mockResolvedValue(undefined),
  } as unknown as SessionService;

  const accessTokens = {
    sign: jest.fn().mockReturnValue('mock-jwt-access-token'),
    ttlSeconds: 900,
  } as unknown as AccessTokenService;

  const users = {
    findOrCreateByPhone: jest.fn().mockResolvedValue({
      id: 'user-1',
      phone: PHONE,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      name: null,
      email: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findById: jest.fn().mockResolvedValue({
      id: 'user-1',
      phone: PHONE,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      name: null,
      email: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  } as unknown as UsersService;

  const rateLimiter = {
    consume: jest.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
  } as unknown as RateLimiterService;

  const config = {
    isProduction,
    isDevelopment: !isProduction,
    isTest: false,
    otpTtlSeconds: 300,
  } as AppConfigService;

  const sms = {
    send: jest.fn().mockResolvedValue(undefined),
  } as unknown as SmsSender;

  const service = new AuthService(otp, sessions, accessTokens, users, rateLimiter, config, sms);

  return { service, otp, sessions, accessTokens, users, sms, rateLimiter };
}

describe('AuthService', () => {
  describe('requestOtp', () => {
    it('returns devOtp in development / non-production mode', async () => {
      const { service, sms } = buildAuthService(false);

      const result = await service.requestOtp({ phone: PHONE }, CONTEXT);

      expect(result.expiresInSeconds).toBe(300);
      expect(result.retryAfterSeconds).toBe(60);
      expect(result.devOtp).toBe('654321');
      expect(sms.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: PHONE,
          body: expect.stringContaining('654321'),
        }),
      );
    });

    it('NEVER returns devOtp in production mode', async () => {
      const { service, sms } = buildAuthService(true);

      const result = await service.requestOtp({ phone: PHONE }, CONTEXT);

      expect(result.expiresInSeconds).toBe(300);
      expect(result.retryAfterSeconds).toBe(60);
      expect(result.devOtp).toBeUndefined();
      expect(sms.send).toHaveBeenCalled();
    });

    it('rejects immediate second request with RateLimitedException and retryAfterSeconds', async () => {
      const { service, rateLimiter } = buildAuthService(false);

      // First request succeeds
      const first = await service.requestOtp({ phone: PHONE }, CONTEXT);
      expect(first.retryAfterSeconds).toBe(60);
      expect(first.expiresInSeconds).toBe(300);

      // Immediate second request: cooldown rate limiter rejects with retryAfterSeconds: 59
      (rateLimiter.consume as jest.Mock).mockResolvedValueOnce({
        allowed: false,
        retryAfterSeconds: 59,
        remaining: 0,
      });

      let threw = false;
      try {
        await service.requestOtp({ phone: PHONE }, CONTEXT);
      } catch (err) {
        threw = true;
        expect(err).toBeInstanceOf(RateLimitedException);
        expect((err as RateLimitedException).details).toEqual({ retryAfterSeconds: 59 });
      }
      expect(threw).toBe(true);
    });

    it('allows request after cooldown expires', async () => {
      const { service, rateLimiter } = buildAuthService(false);

      // After cooldown expires: rateLimiter.consume allows request
      (rateLimiter.consume as jest.Mock).mockResolvedValue({
        allowed: true,
        retryAfterSeconds: 0,
        remaining: 1,
      });

      const res = await service.requestOtp({ phone: PHONE }, CONTEXT);
      expect(res.retryAfterSeconds).toBe(60);
      expect(res.expiresInSeconds).toBe(300);
    });
  });

  describe('verifyOtp', () => {
    it('verifies OTP, creates session and returns tokens and user', async () => {
      const { service, otp, sessions } = buildAuthService(false);

      const session = await service.verifyOtp({ phone: PHONE, code: '654321' }, CONTEXT);

      expect(otp.verify).toHaveBeenCalledWith(PHONE, '654321');
      expect(sessions.create).toHaveBeenCalledWith('user-1', CONTEXT.userAgent);
      expect(session.tokens.accessToken).toBe('mock-jwt-access-token');
      expect(session.tokens.refreshToken).toBe('refresh-token-1');
      expect(session.user.id).toBe('user-1');
      expect(session.user.phone).toBe(PHONE);
    });
  });

  describe('refresh', () => {
    it('rotates session and issues new tokens', async () => {
      const { service, sessions } = buildAuthService(false);

      const refreshed = await service.refresh('old-refresh-token', CONTEXT);

      expect(sessions.rotate).toHaveBeenCalledWith('old-refresh-token', CONTEXT.userAgent);
      expect(refreshed.tokens.accessToken).toBe('mock-jwt-access-token');
      expect(refreshed.tokens.refreshToken).toBe('refresh-token-2');
    });
  });

  describe('logout', () => {
    it('revokes session idempotently', async () => {
      const { service, sessions } = buildAuthService(false);

      await service.logout('refresh-token-to-revoke');

      expect(sessions.revoke).toHaveBeenCalledWith('refresh-token-to-revoke');
    });
  });
});
