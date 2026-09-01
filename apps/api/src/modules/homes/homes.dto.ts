import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AssetType } from '@prisma/client';

export const CreateHomeSchema = z.object({
  name: z.string().min(1).max(100),
  addressId: z.uuid(),
});

export const UpdateHomeSchema = CreateHomeSchema.partial();

export const CreateAssetSchema = z.object({
  assetType: z.nativeEnum(AssetType),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  purchaseDate: z.iso.datetime().optional(),
  warrantyEnd: z.iso.datetime().optional(),
  notes: z.string().max(1000).optional(),
  imageUrl: z.url().max(1024).optional(),
});

export const UpdateAssetSchema = CreateAssetSchema.partial();

export const CreateMaintenanceRecordSchema = z.object({
  bookingId: z.uuid().optional(),
  serviceDate: z.iso.datetime(),
  summary: z.string().min(1),
  nextDueDate: z.iso.datetime().optional(),
  cost: z.number().int().min(0).optional(),
});

export class CreateHomeDto extends createZodDto(CreateHomeSchema) {}
export class UpdateHomeDto extends createZodDto(UpdateHomeSchema) {}
export class CreateAssetDto extends createZodDto(CreateAssetSchema) {}
export class UpdateAssetDto extends createZodDto(UpdateAssetSchema) {}
export class CreateMaintenanceRecordDto extends createZodDto(CreateMaintenanceRecordSchema) {}
export class UpdateMaintenanceRecordDto extends createZodDto(
  CreateMaintenanceRecordSchema.partial(),
) {}

export type CreateHomeInput = z.infer<typeof CreateHomeSchema>;
export type UpdateHomeInput = z.infer<typeof UpdateHomeSchema>;
export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;
export type CreateMaintenanceRecordInput = z.infer<typeof CreateMaintenanceRecordSchema>;
