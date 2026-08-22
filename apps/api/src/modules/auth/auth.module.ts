import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from '../../config/app-config.service';
import { UsersModule } from '../users/users.module';
import { AccessTokenService } from './access-token.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { SessionService } from './session.service';
import { LoggingSmsSender } from './sms/logging-sms-sender';
import { SMS_SENDER, type SmsSender } from './sms/sms-sender';

/**
 * Authentication module.
 *
 * The SMS sender is chosen at wiring time from configuration. Adding a real
 * provider means one new implementation plus one branch here; nothing in the
 * authentication logic changes.
 *
 * `apiEnvSchema` already refuses to boot a production deployment configured with
 * the `log` provider, so the exhaustive switch below cannot silently ship a
 * non-delivering sender.
 */
@Module({
  imports: [
    UsersModule,
    // Secrets are supplied per-call in AccessTokenService rather than baked in
    // here, so a rotated JWT_SECRET does not require re-registering the module.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    SessionService,
    AccessTokenService,
    LoggingSmsSender,
    {
      provide: SMS_SENDER,
      inject: [AppConfigService, LoggingSmsSender],
      useFactory: (config: AppConfigService, loggingSender: LoggingSmsSender): SmsSender => {
        switch (config.smsProvider) {
          case 'log':
            return loggingSender;
        }
      },
    },
  ],
  exports: [AccessTokenService, SessionService, OtpService],
})
export class AuthModule {}
