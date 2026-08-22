import { ConflictException, Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import type { UpdateProfileInput } from '@nest/validation';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * User records.
 *
 * A user is created the moment a phone number is verified; there is no separate
 * registration step. Everything else about the person is optional and filled in
 * later.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Returns the user for a verified phone number, creating one on first sign-in.
   *
   * `upsert` leans on the unique index rather than a read-then-write, so two
   * simultaneous first sign-ins cannot both insert.
   */
  async findOrCreateByPhone(phone: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { phone },
      create: { phone },
      update: {},
    });
  }

  /**
   * Applies a profile patch.
   *
   * Only `name` and `email` are writable. Phone, role and status are excluded at
   * the schema level, so a caller cannot promote themselves or lift their own
   * suspension by sending extra fields — the validation pipe strips them.
   */
  async updateProfile(id: string, patch: UpdateProfileInput): Promise<User> {
    const data: Prisma.UserUpdateInput = {};

    if (patch.name !== undefined) {
      data.name = patch.name;
    }

    if (patch.email !== undefined) {
      data.email = patch.email;
    }

    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (error) {
      if (isUniqueViolationOn(error, 'email')) {
        throw new ConflictException('That email address is already in use.');
      }

      throw error;
    }
  }
}

/**
 * Detects a Prisma unique-constraint violation on a specific field.
 *
 * Duck-typed rather than using `instanceof PrismaClientKnownRequestError` so the
 * check does not depend on Prisma's export shape.
 */
function isUniqueViolationOn(error: unknown, field: string): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const { code, meta } = error as { code: unknown; meta?: unknown };

  if (code !== 'P2002') {
    return false;
  }

  if (typeof meta !== 'object' || meta === null || !('target' in meta)) {
    // Prisma omits the target for some drivers; treat any unique violation on an
    // update that only touches email as an email collision.
    return true;
  }

  const { target } = meta as { target: unknown };

  if (Array.isArray(target)) {
    return target.includes(field);
  }

  return typeof target === 'string' && target.includes(field);
}
