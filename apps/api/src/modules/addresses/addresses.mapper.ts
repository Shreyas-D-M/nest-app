import type { UserAddress } from '@prisma/client';
import type { Address, IsoTimestamp, Uuid } from '@nest/types';

/**
 * Maps an address row to its API representation.
 *
 * `userId` and `deletedAt` are deliberately not exposed: the owner is always the
 * caller, and soft-deletion is an internal retention mechanism.
 *
 * Mapped field by field rather than spread, so a column added later cannot leak
 * into responses by accident.
 */
export function toAddress(address: UserAddress): Address {
  return {
    id: address.id as Uuid,
    label: address.label,
    addressLine: address.addressLine,
    locality: address.locality,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    latitude: address.latitude,
    longitude: address.longitude,
    instructions: address.instructions,
    createdAt: address.createdAt.toISOString() as IsoTimestamp,
    updatedAt: address.updatedAt.toISOString() as IsoTimestamp,
  };
}
