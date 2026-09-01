import type { Prisma } from '@prisma/client';

/**
 * Conversation between customer and professional for a booking.
 */
export type Conversation = Prisma.ConversationGetPayload<{
  include: {
    customer: { select: { id: true; name: true; avatarUrl: true; phone: true } };
    professional: { select: { id: true; name: true; avatarUrl: true; phone: true } };
    booking: { select: { id: true; status: true; scheduledStart: true } };
  };
}>;

/**
 * Message in a conversation.
 */
export type Message = Prisma.MessageGetPayload<{
  include: {
    sender: { select: { id: true; name: true; avatarUrl: true } };
  };
}>;

/**
 * Message type enum.
 */
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
  SYSTEM = 'SYSTEM',
}

/**
 * Conversation with last message for listing.
 */
export type ConversationListItem = Prisma.ConversationGetPayload<{
  include: {
    customer: { select: { id: true; name: true; avatarUrl: true; phone: true } };
    professional: { select: { id: true; name: true; avatarUrl: true; phone: true } };
    booking: { select: { id: true; status: true; scheduledStart: true } };
    messages: {
      take: 1;
      orderBy: { createdAt: 'desc' };
      select: {
        id: true;
        body: true;
        messageType: true;
        senderId: true;
        createdAt: true;
        readAt: true;
      };
    };
  };
}>;
