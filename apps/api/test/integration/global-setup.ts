import { execFileSync } from 'node:child_process';
import { INTEGRATION_DATABASE_URL } from './env';

/**
 * Brings the test database schema up to date before the integration suites run.
 *
 * `migrate deploy` applies committed migrations without generating new ones, which
 * is the same command a deployment uses — so the suites verify the migrations that
 * will actually ship, not a schema pushed straight from the Prisma models.
 */
export default function globalSetup(): void {
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: INTEGRATION_DATABASE_URL },
    stdio: 'inherit',
  });
}
