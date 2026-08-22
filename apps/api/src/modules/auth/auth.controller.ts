import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthSession, OtpRequestResult } from '@nest/types';
import { AuthService, type RequestContextInfo } from './auth.service';
import { LogoutDto, OtpRequestDto, OtpVerifyDto, RefreshDto } from './auth.dto';
import { Public } from './decorators/public.decorator';

/**
 * Authentication endpoints, exactly as defined in 06_API_SPEC.md.
 *
 * All are `@Public()`: they are how a caller *becomes* authenticated, so the
 * global access-token guard must not apply. Each is rate limited inside the
 * service.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.ACCEPTED)
  requestOtp(@Body() dto: OtpRequestDto, @Req() request: Request): Promise<OtpRequestResult> {
    return this.auth.requestOtp(dto, contextFrom(request));
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: OtpVerifyDto, @Req() request: Request): Promise<AuthSession> {
    return this.auth.verifyOtp(dto, contextFrom(request));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto, @Req() request: Request): Promise<AuthSession> {
    return this.auth.refresh(dto.refreshToken, contextFrom(request));
  }

  /**
   * Revokes the supplied refresh token.
   *
   * Public because a client whose access token has already expired must still be
   * able to log out — requiring a live access token would leave dead sessions
   * behind. Possession of the refresh token is the authorization here.
   *
   * Returns 204 whether or not the token was live, so it cannot be used to probe
   * which tokens exist.
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }
}

/**
 * Extracts rate-limiting inputs from the request.
 *
 * `request.ip` respects Express's trust-proxy setting. It is used only as a
 * rate-limit key and is never stored — 07_ARCHITECTURE.md requires PII
 * minimisation, and an IP address is personal data.
 */
function contextFrom(request: Request): RequestContextInfo {
  return {
    ip: request.ip ?? 'unknown',
    userAgent: request.get('user-agent'),
  };
}
