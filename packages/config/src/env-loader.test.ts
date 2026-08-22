import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EnvValidationError, loadEnv } from './env-loader';

const schema = z.object({
  PORT: z.coerce.number().int(),
  SECRET_TOKEN: z.string().min(10),
});

describe('loadEnv', () => {
  it('returns typed, coerced configuration', () => {
    const result = loadEnv(schema, { PORT: '3000', SECRET_TOKEN: 'abcdefghij' });

    expect(result.PORT).toBe(3000);
    expect(result.SECRET_TOKEN).toBe('abcdefghij');
  });

  it('throws when a required variable is missing', () => {
    expect(() => loadEnv(schema, { PORT: '3000' })).toThrow(EnvValidationError);
  });

  it('names the offending variables', () => {
    try {
      loadEnv(schema, { PORT: 'not-a-number', SECRET_TOKEN: 'short' });
      expect.unreachable('expected loadEnv to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const issues = (error as EnvValidationError).issues.map((i) => i.variable);
      expect(issues).toContain('PORT');
      expect(issues).toContain('SECRET_TOKEN');
    }
  });

  it('never leaks variable values into the error message', () => {
    try {
      loadEnv(schema, { PORT: '3000', SECRET_TOKEN: 'leaky' });
      expect.unreachable('expected loadEnv to throw');
    } catch (error) {
      expect((error as Error).message).not.toContain('leaky');
      expect((error as Error).message).toContain('SECRET_TOKEN');
    }
  });
});
