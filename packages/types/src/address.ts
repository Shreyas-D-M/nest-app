import type { IsoTimestamp, Uuid } from './primitives';

/**
 * A saved address belonging to the calling user.
 *
 * `userId` is deliberately absent: every address returned by the API belongs to
 * the caller, so echoing the owner adds nothing and invites the habit of
 * trusting a client-supplied owner id.
 */
export interface Address {
  id: Uuid;
  label: string;
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  instructions: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface CreateAddressInput {
  label: string;
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  instructions?: string | null;
}

export type UpdateAddressInput = Partial<CreateAddressInput>;
