import { z } from 'zod';
import { boundedTextSchema } from './primitives';

/**
 * Profile update schema for PATCH /me.
 *
 * Deliberately excluded:
 *   phone      — the login identity. Changing it requires re-verification, and
 *                06_API_SPEC.md defines no endpoint for that.
 *   role/status— authorization state. A user must never be able to promote or
 *                un-suspend themselves.
 *   avatarUrl  — there is no documented upload endpoint yet, and accepting an
 *                arbitrary client-supplied URL invites SSRF and hotlinking.
 *
 * `null` clears a field; omitting it leaves the field untouched.
 */
export const updateProfileSchema = z
  .object({
    name: boundedTextSchema(1, 120).nullable().optional(),
    email: z.string().trim().toLowerCase().email().max(255).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
