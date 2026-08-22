import { z } from 'zod';
import {
  boundedTextSchema,
  indianPincodeSchema,
  latitudeSchema,
  longitudeSchema,
} from './primitives';

/**
 * Address schemas for /me/addresses.
 *
 * Field lengths mirror the database column widths so that a value which passes
 * validation cannot then fail on insert.
 */

const coordinatesPresentTogether = (value: {
  latitude?: number | null;
  longitude?: number | null;
}): boolean => {
  const hasLatitude = value.latitude !== undefined && value.latitude !== null;
  const hasLongitude = value.longitude !== undefined && value.longitude !== null;

  return hasLatitude === hasLongitude;
};

const COORDINATE_PAIR_MESSAGE = 'Latitude and longitude must be provided together';

const addressFields = {
  /** Short user-facing name, e.g. "Home", "Office". */
  label: boundedTextSchema(1, 40),
  addressLine: boundedTextSchema(1, 255),
  locality: boundedTextSchema(1, 120),
  city: boundedTextSchema(1, 120),
  state: boundedTextSchema(1, 120),
  pincode: indianPincodeSchema,
  latitude: latitudeSchema.nullable().optional(),
  longitude: longitudeSchema.nullable().optional(),
  /** Access guidance, e.g. "gate code 1234, second floor". */
  instructions: boundedTextSchema(1, 500).nullable().optional(),
};

export const createAddressSchema = z
  .object(addressFields)
  .refine(coordinatesPresentTogether, { message: COORDINATE_PAIR_MESSAGE });

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

/**
 * PATCH is partial, but must still change something — an empty body is a client
 * bug, not a no-op worth a database write.
 */
export const updateAddressSchema = z
  .object(addressFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })
  .refine(coordinatesPresentTogether, { message: COORDINATE_PAIR_MESSAGE });

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
