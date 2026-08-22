import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Loads a local `.env` file in development using Node's built-in loader.
 *
 * This avoids a `dotenv` dependency. It is a convenience for local work only —
 * in staging and production, configuration comes from the platform's environment
 * or secret manager, so the file is neither expected nor read there.
 */
export function loadLocalEnvFile(path: string = resolve(process.cwd(), '.env')): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (!existsSync(path)) {
    return;
  }

  process.loadEnvFile(path);
}
