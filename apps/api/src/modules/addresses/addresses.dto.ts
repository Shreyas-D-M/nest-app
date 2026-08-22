import { createAddressSchema, updateAddressSchema } from '@nest/validation';
import { createZodDto } from '../../common/validation/zod-dto';

export class CreateAddressDto extends createZodDto(createAddressSchema) {}

export class UpdateAddressDto extends createZodDto(updateAddressSchema) {}
