import { createZodDto } from 'nestjs-zod';
import {
  CreateConversationSchema,
  SendMessageSchema,
  GetMessagesSchema,
  type CreateConversationInput,
  type SendMessageInput,
  type GetMessagesInput,
} from '@nest/validation';

export class CreateConversationDto extends createZodDto(CreateConversationSchema) {}
export class SendMessageDto extends createZodDto(SendMessageSchema) {}
export class GetMessagesDto extends createZodDto(GetMessagesSchema) {}

export { type CreateConversationInput, type SendMessageInput, type GetMessagesInput };
