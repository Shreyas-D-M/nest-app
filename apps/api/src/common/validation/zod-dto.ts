import type { ZodType } from 'zod';

/**
 * Bridges shared Zod schemas into Nest's DTO metadata system.
 *
 * Nest discovers a handler's parameter type through decorator metadata, so a
 * schema has to be reachable from a class. `createZodDto` wraps a schema from
 * `@nest/validation` in a class whose static `zodSchema` the global pipe reads.
 *
 * The result is one schema definition shared by the API, the mobile apps and the
 * admin app — no second copy to keep in sync.
 *
 * Usage, once endpoints exist:
 *
 *   class CreateAddressDto extends createZodDto(CreateAddressSchema) {}
 *
 *   @Post()
 *   create(@Body() dto: CreateAddressDto) { ... }
 */
export interface ZodDtoStatic<TOutput> {
  new (): TOutput;
  readonly zodSchema: ZodType<TOutput>;
}

export function createZodDto<TOutput>(schema: ZodType<TOutput>): ZodDtoStatic<TOutput> {
  class ZodDto {
    static readonly zodSchema = schema;
  }

  return ZodDto as unknown as ZodDtoStatic<TOutput>;
}

export function isZodDto(metatype: unknown): metatype is ZodDtoStatic<unknown> {
  return typeof metatype === 'function' && 'zodSchema' in metatype;
}
