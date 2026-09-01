import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, MessageType } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(userId: string, bookingId: string) {
    // Verify user has access to this booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        professional: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if user is either the customer or the professional
    const isCustomer = booking.customerId === userId;
    const isProfessional = booking.professional?.id === userId;

    if (!isCustomer && !isProfessional) {
      throw new ForbiddenException('Not authorized to access this booking');
    }

    // Check if conversation already exists
    const existing = await this.prisma.conversation.findUnique({
      where: { bookingId },
    });

    if (existing) {
      return existing;
    }

    // Create conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        bookingId,
        customerId: booking.customerId,
        professionalId: booking.professionalId,
      },
      include: {
        customer: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        professional: { select: { id: true, name: true, avatarUrl: true, phone: true } },
      },
    });

    return conversation;
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        professional: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        booking: { select: { id: true, status: true, scheduledStart: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check authorization
    if (conversation.customerId !== userId && conversation.professionalId !== userId) {
      throw new ForbiddenException('Not authorized to access this conversation');
    }

    return conversation;
  }

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ customerId: userId }, { professionalId: userId }],
      },
      include: {
        customer: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        professional: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        booking: { select: { id: true, status: true, scheduledStart: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            body: true,
            messageType: true,
            senderId: true,
            createdAt: true,
            readAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations;
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    input: { body?: string; messageType: MessageType; mediaUrl?: string },
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check authorization
    if (conversation.customerId !== userId && conversation.professionalId !== userId) {
      throw new ForbiddenException('Not authorized to send message in this conversation');
    }

    // Validate message has content
    if (!input.body && !input.mediaUrl) {
      throw new ForbiddenException('Message must have body or media');
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        messageType: input.messageType,
        body: input.body,
        mediaUrl: input.mediaUrl,
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // TODO: Create notification for the other participant
    // This will be implemented when WebSocket integration is added

    return message;
  }

  async getMessages(
    userId: string,
    conversationId: string,
    query: { limit?: number; offset?: number; beforeId?: string },
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check authorization
    if (conversation.customerId !== userId && conversation.professionalId !== userId) {
      throw new ForbiddenException('Not authorized to access this conversation');
    }

    const { limit = 50, offset = 0, beforeId } = query;

    const where: Prisma.MessageWhereInput = {
      conversationId,
      ...(beforeId ? { id: { lt: beforeId } } : {}),
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.message.count({ where }),
    ]);

    return { messages, total, limit, offset };
  }

  async markAsRead(userId: string, conversationId: string, messageIds: string[]) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check authorization
    if (conversation.customerId !== userId && conversation.professionalId !== userId) {
      throw new ForbiddenException('Not authorized to mark messages as read');
    }

    await this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        conversationId,
        senderId: { not: userId }, // Only mark messages from the other party
      },
      data: { readAt: new Date() },
    });

    return { success: true };
  }
}
