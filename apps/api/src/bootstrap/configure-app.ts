import type { INestApplication } from '@nestjs/common';
import { API_PREFIX } from '@nest/types';
import { requestIdMiddleware } from '../common/request-context/request-id.middleware';
import { AppConfigService } from '../config/app-config.service';

/**
 * Applies runtime configuration shared by the server and the end-to-end tests.
 *
 * Keeping this in one function means tests exercise the same prefix, middleware
 * order and CORS policy as production, instead of a near approximation.
 */
export function configureApp(app: INestApplication): void {
  // Registered with `app.use` so it runs before module-scoped middleware —
  // notably the HTTP logger, which reads the request id this establishes.
  app.use(requestIdMiddleware);

  app.setGlobalPrefix(API_PREFIX);

  const config = app.get(AppConfigService);
  const allowedOrigins = config.corsAllowedOrigins;

  if (allowedOrigins.length > 0) {
    // Credentials are not enabled: the API uses bearer tokens rather than
    // cookies, so allowing credentialed cross-origin requests would widen the
    // surface for no benefit.
    app.enableCors({ origin: [...allowedOrigins] });
  }

  // Lets Nest run onModuleDestroy hooks (closing the Prisma and Redis
  // connections) when the container receives SIGTERM.
  app.enableShutdownHooks();
}
