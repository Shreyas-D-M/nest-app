import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateVehicleSchema = z.object({
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  variant: z.string().max(50).optional(),
  registrationMasked: z.string().min(1).max(20),
  purchaseDate: z.iso.datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

export class CreateVehicleDto extends createZodDto(CreateVehicleSchema) {}
export class UpdateVehicleDto extends createZodDto(UpdateVehicleSchema) {}

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
