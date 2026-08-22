import type { ArgumentMetadata } from '@nestjs/common';
import { z } from '@nest/validation';
import { ValidationFailedException } from '../errors/api-exception';
import { createZodDto } from './zod-dto';
import { ZodValidationPipe } from './zod-validation.pipe';

const schema = z.object({
  label: z.string().min(1).max(40),
  amountMinor: z.number().int().nonnegative(),
});

class SampleDto extends createZodDto(schema) {}

function metadata(metatype: unknown): ArgumentMetadata {
  return { type: 'body', metatype: metatype as ArgumentMetadata['metatype'] };
}

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe();

  it('returns the parsed value for a valid payload', () => {
    const result = pipe.transform({ label: 'Deposit', amountMinor: 125050 }, metadata(SampleDto));

    expect(result).toEqual({ label: 'Deposit', amountMinor: 125050 });
  });

  it('strips properties the schema does not declare', () => {
    const result = pipe.transform(
      { label: 'Deposit', amountMinor: 100, isAdmin: true },
      metadata(SampleDto),
    );

    expect(result).not.toHaveProperty('isAdmin');
  });

  it('throws a validation failure for an invalid payload', () => {
    expect(() => pipe.transform({ label: '', amountMinor: -5 }, metadata(SampleDto))).toThrow(
      ValidationFailedException,
    );
  });

  it('reports the failing field paths', () => {
    try {
      pipe.transform({ label: '', amountMinor: 1.5 }, metadata(SampleDto));
      throw new Error('expected the pipe to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationFailedException);
      const { details } = error as ValidationFailedException;
      const issues = details['issues'] as Array<{ path: string; message: string }>;
      expect(issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining(['label', 'amountMinor']),
      );
    }
  });

  it('does not echo submitted values back in the error, keeping input out of logs', () => {
    try {
      pipe.transform({ label: '', amountMinor: 'not-a-number' }, metadata(SampleDto));
      throw new Error('expected the pipe to throw');
    } catch (error) {
      expect(JSON.stringify((error as ValidationFailedException).details)).not.toContain(
        'not-a-number',
      );
    }
  });

  it('passes values through when the parameter is not a Zod DTO', () => {
    expect(pipe.transform('raw-route-param', metadata(String))).toBe('raw-route-param');
    expect(pipe.transform({ any: 'thing' }, metadata(undefined))).toEqual({ any: 'thing' });
  });
});
