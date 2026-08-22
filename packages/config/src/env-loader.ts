import type { ZodType } from 'zod';

/**
 * Fail-fast environment loading.
 *
 * Configuration is validated once, at startup. If a required variable is
 * missing or malformed the process refuses to boot rather than failing later on
 * a request path.
 *
 * The thrown error reports variable NAMES and validation messages only. Values
 * are never included, because environment variables hold secrets and errors
 * routinely end up in logs and crash reporters.
 */

export class EnvValidationError extends Error {
  public readonly issues: readonly EnvIssue[];

  constructor(issues: readonly EnvIssue[]) {
    const summary = issues.map((issue) => `  - ${issue.variable}: ${issue.message}`).join('\n');

    super(`Invalid environment configuration:\n${summary}`);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

export interface EnvIssue {
  variable: string;
  message: string;
}

export type EnvSource = Record<string, string | undefined>;

/**
 * Validates `source` against `schema` and returns the parsed, typed result.
 *
 * @throws EnvValidationError when validation fails. The message lists offending
 * variable names without their values.
 */
export function loadEnv<T>(schema: ZodType<T>, source: EnvSource = process.env): T {
  const result = schema.safeParse(source);

  if (result.success) {
    return result.data;
  }

  const issues: EnvIssue[] = result.error.issues.map((issue) => ({
    variable: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));

  throw new EnvValidationError(issues);
}
