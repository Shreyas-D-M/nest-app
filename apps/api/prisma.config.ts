import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration (Prisma 7).
 *
 * Prisma 7 no longer accepts `url` inside the schema's datasource block, so the
 * connection string for CLI commands — `migrate`, `db`, `studio` — is supplied
 * here. The runtime client gets its own connection via the pg driver adapter in
 * `src/prisma/prisma.service.ts`.
 */

// Prisma does not load .env files itself. Node's built-in loader covers this
// without adding a dotenv dependency. Scripts run with the package directory as
// the working directory.
const envPath = resolve(process.cwd(), '.env');

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    // Deliberately NOT Prisma's `env()` helper. That helper throws when the
    // variable is missing, and every CLI invocation parses this file — including
    // `prisma generate`, which runs during install and in CI where no database
    // URL exists. Commands that genuinely need a connection fail on their own
    // with a clearer message.
    url: process.env.DATABASE_URL ?? '',
  },
});
