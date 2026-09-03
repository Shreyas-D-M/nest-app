import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { loadLocalEnvFile } from './bootstrap/load-local-env';
import { AppConfigService } from './config/app-config.service';

// Must run before the Nest container is created: the configuration module
// validates the environment during module initialisation.
loadLocalEnvFile();

async function bootstrap(): Promise<void> {
  // Logs emitted during startup are buffered until the pino logger is attached,
  // so nothing is lost and nothing is printed in the wrong format.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  configureApp(app);

  const config = app.get(AppConfigService);

  await app.listen(config.port, '0.0.0.0');
}

void bootstrap();
