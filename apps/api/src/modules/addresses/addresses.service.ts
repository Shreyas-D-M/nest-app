import { Injectable } from '@nestjs/common';
import type { Prisma, UserAddress } from '@prisma/client';
import type { CreateAddressInput, UpdateAddressInput } from '@nest/validation';
import { ResourceNotFoundException } from '../../common/errors/api-exception';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Saved addresses.
 *
 * **Ownership is enforced in the query, not after it.** Every read and write is
 * scoped by `userId`, so an address belonging to someone else is simply not
 * found — there is no window in which a row is fetched and then checked.
 *
 * A missing address and another user's address both produce 404. Returning 403 for
 * the latter would confirm that the id exists, which is an information leak, and
 * addresses are among the most sensitive data NEST holds (02_PRD.md).
 *
 * Deletion is soft: bookings will reference an address, so removing the row would
 * destroy booking history.
 */
@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<UserAddress[]> {
    return this.prisma.userAddress.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, input: CreateAddressInput): Promise<UserAddress> {
    return this.prisma.userAddress.create({
      data: {
        userId,
        label: input.label,
        addressLine: input.addressLine,
        locality: input.locality,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        instructions: input.instructions ?? null,
      },
    });
  }

  /**
   * Applies a patch to an address the caller owns.
   *
   * @throws ResourceNotFoundException when the address does not exist, is
   * deleted, or belongs to another user.
   */
  async update(userId: string, addressId: string, patch: UpdateAddressInput): Promise<UserAddress> {
    const data = buildUpdateData(patch);

    // updateMany takes a full where clause, so ownership is part of the write
    // itself. `update` only accepts a unique selector and could not express it.
    const result = await this.prisma.userAddress.updateMany({
      where: { id: addressId, userId, deletedAt: null },
      data,
    });

    if (result.count !== 1) {
      throw new ResourceNotFoundException('Address not found.');
    }

    const updated = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });

    if (updated === null) {
      throw new ResourceNotFoundException('Address not found.');
    }

    return updated;
  }

  /**
   * Soft-deletes an address the caller owns.
   *
   * @throws ResourceNotFoundException when the address does not exist, is already
   * deleted, or belongs to another user.
   */
  async softDelete(userId: string, addressId: string, now: Date = new Date()): Promise<void> {
    const result = await this.prisma.userAddress.updateMany({
      where: { id: addressId, userId, deletedAt: null },
      data: { deletedAt: now },
    });

    if (result.count !== 1) {
      throw new ResourceNotFoundException('Address not found.');
    }
  }
}

/**
 * Translates a validated patch into a Prisma update payload.
 *
 * Only keys actually present are copied, so `PATCH` leaves unmentioned fields
 * alone instead of overwriting them with undefined.
 */
function buildUpdateData(patch: UpdateAddressInput): Prisma.UserAddressUpdateManyMutationInput {
  const data: Prisma.UserAddressUpdateManyMutationInput = {};

  if (patch.label !== undefined) {
    data.label = patch.label;
  }

  if (patch.addressLine !== undefined) {
    data.addressLine = patch.addressLine;
  }

  if (patch.locality !== undefined) {
    data.locality = patch.locality;
  }

  if (patch.city !== undefined) {
    data.city = patch.city;
  }

  if (patch.state !== undefined) {
    data.state = patch.state;
  }

  if (patch.pincode !== undefined) {
    data.pincode = patch.pincode;
  }

  if (patch.latitude !== undefined) {
    data.latitude = patch.latitude;
  }

  if (patch.longitude !== undefined) {
    data.longitude = patch.longitude;
  }

  if (patch.instructions !== undefined) {
    data.instructions = patch.instructions;
  }

  return data;
}
