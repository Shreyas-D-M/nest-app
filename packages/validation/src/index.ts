export * from './address';
export * from './admin';
export * from './auth';
export * from './booking';
export * from './conversation';
export * from './env';
export * from './money';
export * from './payment';
export * from './primitives';
export * from './professional';
export * from './service-request';
export * from './support';
export * from './user';

// Re-exported so consumers use exactly one Zod instance across the monorepo.
// Two copies of Zod produce schemas that fail each other's instanceof checks.
export { z } from 'zod';
export type { ZodError, ZodType } from 'zod';
