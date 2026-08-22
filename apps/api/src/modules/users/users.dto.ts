import { updateProfileSchema } from '@nest/validation';
import { createZodDto } from '../../common/validation/zod-dto';

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
