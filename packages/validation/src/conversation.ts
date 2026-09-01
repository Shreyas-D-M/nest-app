import { z } from 'zod';
import { MessageType } from '@prisma/client';

export const CreateConversationSchema = z.object({
  bookingId: z.uuid(),
});

export const SendMessageSchema = z.object({
  body: z.string().min(1).max(2000).optional(),
  messageType: z.nativeEnum(MessageType).default(MessageType.TEXT),
  mediaUrl: z.url().max(1024).optional(),
});

export const GetMessagesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  beforeId: z.uuid().optional(),
});

export const MarkMessagesReadSchema = z.object({
  messageIds: z.array(z.uuid()).min(1).max(50),
});

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type GetMessagesInput = z.infer<typeof GetMessagesSchema>;
export type MarkMessagesReadInput = z.infer<typeof MarkMessagesReadSchema>;
