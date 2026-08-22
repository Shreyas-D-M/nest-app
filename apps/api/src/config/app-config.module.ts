import { Global, Module } from '@nestjs/common';
import { loadEnv } from '@nest/config';
import { AppConfigService } from './app-config.service';
import { apiEnvSchema } from './env.schema';

/**
 * Global configuration module.
 *
 * Validation happens in the factory, so an invalid environment fails during
 * module initialisation — before the server binds a port.
 */
@Global()
@Module({
  providers: [
    {
      provide: AppConfigService,
      useFactory: (): AppConfigService => new AppConfigService(loadEnv(apiEnvSchema)),
    },
  ],
  exports: [AppConfigService],
})
export class AppConfigModule {}
