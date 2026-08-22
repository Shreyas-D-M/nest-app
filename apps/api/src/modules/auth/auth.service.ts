import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AuthSession, AuthTokens, OtpRequestResult } from '@nest/types';
import { BEARER_PREFIX } from '@nest/types';
import type { OtpRequestInput, OtpVerifyInput } from '@nest/validation';
import { RateLimiterService } from '../../common/rate-limit/rate-limiter.service';
import { AppConfigService } from '../../config/app-config.service';
import { toCurrentUser } from '../users/users.mapper';
import { UsersService } from '../users/users.service';
import { AccessTokenService } from './access-token.service';
import { AccountSuspendedException, RateLimitedException } from './auth.exceptions';
import {
  OTP_REQUEST_COOLDOWN,
  OTP_REQUEST_PER_IP,
  OTP_REQUEST_PER_PHONE,
  OTP_VERIFY_PER_IP,
  REFRESH_PER_IP,
} from './auth.rate-limits';
import { OtpService } from './otp.service';
import { SessionService } from './session.service';
import { SMS_SENDER, type SmsSender } from './sms/sms-sender';

/**
 * Authentication orchestration.
 *
 * Phone OTP is owned entirely by this API, matching the endpoints in
 * 06_API_SPEC.md. Social sign-in via Firebase is a later phase and nothing here
 * anticipates it beyond leaving the door open.
 */

export interface RequestContextInfo {
  /** Client IP, used only as a rate-limit key. Never persisted. */
  ip: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly otp: OtpService,
    private readonly sessions: SessionService,
    private readonly accessTokens: AccessTokenService,
    private readonly users: UsersService,
    private readonly rateLimiter: RateLimiterService,
    private readonly config: AppConfigService,
    @Inject(SMS_SENDER) private readonly sms: SmsSender,
  ) {}

  /**
   * Issues a verification code.
   *
   * The response is identical whether or not the number has an account: this
   * endpoint must not become a way to discover who is registered.
   */
  async requestOtp(input: OtpRequestInput, context: RequestContextInfo): Promise<OtpRequestResult> {
    const { phone } = input;

    await this.enforce(`otp:req:ip:${context.ip}`, OTP_REQUEST_PER_IP);
    await this.enforce(`otp:req:phone:${phone}`, OTP_REQUEST_PER_PHONE);
    await this.enforce(`otp:cooldown:phone:${phone}`, OTP_REQUEST_COOLDOWN);

    const { code } = await this.otp.issue(phone);

    await this.sms.send({
      to: phone,
      body: `${code} is your NEST verification code. It expires in ${Math.round(
        this.config.otpTtlSeconds / 60,
      )} minutes. Do not share it with anyone.`,
    });

    return {
      expiresInSeconds: this.config.otpTtlSeconds,
      retryAfterSeconds: OTP_REQUEST_COOLDOWN.windowSeconds,
    };
  }

  /** Verifies a code and signs the caller in, creating the account if needed. */
  async verifyOtp(input: OtpVerifyInput, context: RequestContextInfo): Promise<AuthSession> {
    await this.enforce(`otp:verify:ip:${context.ip}`, OTP_VERIFY_PER_IP);

    await this.otp.verify(input.phone, input.code);

    const user = await this.users.findOrCreateByPhone(input.phone);

    if (user.status !== 'ACTIVE') {
      // The code was correct, but the account may not be used. Sessions are not
      // issued, and the reason is not distinguished between suspended and deleted.
      throw new AccountSuspendedException();
    }

    const session = await this.sessions.create(user.id, context.userAgent);

    this.logger.log(`Sign-in completed for user ${user.id}`);

    return {
      tokens: this.buildTokens(user.id, session.sessionId, session.refreshToken, session.expiresAt),
      user: toCurrentUser(user),
    };
  }

  /** Rotates a refresh token and mints a fresh access token. */
  async refresh(refreshToken: string, context: RequestContextInfo): Promise<AuthSession> {
    await this.enforce(`auth:refresh:ip:${context.ip}`, REFRESH_PER_IP);

    const rotated = await this.sessions.rotate(refreshToken, context.userAgent);
    const user = await this.users.findById(rotated.userId);

    if (user === null || user.status !== 'ACTIVE') {
      // The session outlived the account's right to use it. Retire the family so
      // the remaining tokens are dead too.
      await this.sessions.revokeAllForUser(rotated.userId);

      throw new AccountSuspendedException();
    }

    return {
      tokens: this.buildTokens(user.id, rotated.sessionId, rotated.refreshToken, rotated.expiresAt),
      user: toCurrentUser(user),
    };
  }

  /** Revokes a session. Idempotent — an unknown token is not an error. */
  async logout(refreshToken: string): Promise<void> {
    await this.sessions.revoke(refreshToken);
  }

  private buildTokens(
    userId: string,
    sessionId: string,
    refreshToken: string,
    refreshExpiresAt: Date,
  ): AuthTokens {
    return {
      tokenType: BEARER_PREFIX,
      accessToken: this.accessTokens.sign(userId, sessionId),
      expiresInSeconds: this.accessTokens.ttlSeconds,
      refreshToken,
      refreshExpiresInSeconds: Math.max(
        0,
        Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000),
      ),
    };
  }

  private async enforce(
    key: string,
    limit: Parameters<RateLimiterService['consume']>[1],
  ): Promise<void> {
    const decision = await this.rateLimiter.consume(key, limit);

    if (!decision.allowed) {
      throw new RateLimitedException(decision.retryAfterSeconds);
    }
  }
}
