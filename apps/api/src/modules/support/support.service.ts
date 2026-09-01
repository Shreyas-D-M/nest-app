import { Injectable, Inject } from '@nestjs/common';
import type {
  PrismaClient,
  SupportTicket,
  TicketMessage,
  User,
  Booking,
  TicketType,
  TicketPriority,
  TicketStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TicketNotFoundException,
  TicketNotAuthorizedException,
  TicketAlreadyClosedException,
} from './support.exceptions';

type Prisma = PrismaClient;

interface TicketWithRelations extends SupportTicket {
  messages: TicketMessage[];
  requester: Pick<User, 'id' | 'name' | 'phone'>;
  assignedAdmin: Pick<User, 'id' | 'name'> | null;
  booking: Pick<Booking, 'id' | 'customerId' | 'professionalId'> | null;
}

@Injectable()
export class SupportService {
  constructor(@Inject(PrismaService) private readonly prisma: Prisma) {}

  /**
   * Create a support ticket.
   */
  async create(
    customerId: string,
    dto: {
      bookingId?: string;
      category: string;
      subject: string;
      description: string;
      priority?: string;
      attachments?: string[];
    },
  ): Promise<TicketWithRelations> {
    // Verify booking belongs to customer if provided
    if (dto.bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
      });
      if (!booking || booking.customerId !== customerId) {
        throw new TicketNotAuthorizedException('Booking not found or not owned by customer');
      }
    }

    // Map category to TicketType
    const categoryToType: Record<string, TicketType> = {
      BOOKING_ISSUE: 'BOOKING_ISSUE',
      PAYMENT_ISSUE: 'PAYMENT_ISSUE',
      PROFESSIONAL_CONDUCT: 'SAFETY_CONCERN',
      SERVICE_QUALITY: 'QUALITY_COMPLAINT',
      REFUND_REQUEST: 'PAYMENT_ISSUE',
      ACCOUNT_ISSUE: 'ACCOUNT_ISSUE',
      TECHNICAL_ISSUE: 'OTHER',
      OTHER: 'OTHER',
    };

    const priorityMap: Record<string, TicketPriority> = {
      LOW: 'LOW',
      NORMAL: 'MEDIUM',
      HIGH: 'HIGH',
      URGENT: 'URGENT',
    };

    const ticket = await this.prisma.supportTicket.create({
      data: {
        requesterId: customerId,
        bookingId: dto.bookingId ?? null,
        type: categoryToType[dto.category] ?? 'OTHER',
        priority: priorityMap[dto.priority ?? 'NORMAL'] ?? 'MEDIUM',
        status: 'OPEN',
        description: dto.subject + '\n\n' + dto.description,
      },
      include: {
        messages: true,
        requester: { select: { id: true, name: true, phone: true } },
        assignedAdmin: { select: { id: true, name: true } },
        booking: { select: { id: true, customerId: true, professionalId: true } },
      },
    });

    return ticket;
  }

  /**
   * Get a ticket by ID.
   */
  async findById(id: string): Promise<TicketWithRelations> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        requester: { select: { id: true, name: true, phone: true } },
        assignedAdmin: { select: { id: true, name: true } },
        booking: { select: { id: true, customerId: true, professionalId: true } },
      },
    });

    if (!ticket) {
      throw new TicketNotFoundException(id);
    }

    return ticket;
  }

  /**
   * List tickets for a customer.
   */
  async listByCustomer(
    customerId: string,
    query: { status?: string; category?: string; priority?: string; limit: number; offset: number },
  ): Promise<{ data: TicketWithRelations[]; total: number }> {
    const where: Record<string, unknown> = { requesterId: customerId };
    if (query.status) where.status = query.status;
    if (query.priority) {
      const priorityMap: Record<string, TicketPriority> = {
        LOW: 'LOW',
        NORMAL: 'MEDIUM',
        HIGH: 'HIGH',
        URGENT: 'URGENT',
      };
      where.priority = priorityMap[query.priority] ?? 'MEDIUM';
    }
    // Category maps to type in schema
    if (query.category) {
      const categoryToType: Record<string, TicketType> = {
        BOOKING_ISSUE: 'BOOKING_ISSUE',
        PAYMENT_ISSUE: 'PAYMENT_ISSUE',
        PROFESSIONAL_CONDUCT: 'SAFETY_CONCERN',
        SERVICE_QUALITY: 'QUALITY_COMPLAINT',
        REFUND_REQUEST: 'PAYMENT_ISSUE',
        ACCOUNT_ISSUE: 'ACCOUNT_ISSUE',
        TECHNICAL_ISSUE: 'OTHER',
        OTHER: 'OTHER',
      };
      where.type = categoryToType[query.category] ?? 'OTHER';
    }

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          requester: { select: { id: true, name: true, phone: true } },
          assignedAdmin: { select: { id: true, name: true } },
          booking: { select: { id: true, customerId: true, professionalId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Update a ticket (admin only).
   */
  async update(
    _actorId: string,
    actorRole: string,
    ticketId: string,
    dto: {
      status?: string;
      priority?: string;
      assignedToId?: string;
    },
  ): Promise<TicketWithRelations> {
    const ticket = await this.findById(ticketId);

    // Check authorization
    if (actorRole !== 'ADMIN') {
      throw new TicketNotAuthorizedException('Only admins can update tickets');
    }

    // Map status to schema values
    const statusMap: Record<string, TicketStatus> = {
      OPEN: 'OPEN',
      IN_PROGRESS: 'IN_PROGRESS',
      WAITING_CUSTOMER: 'WAITING_CUSTOMER',
      WAITING_INTERNAL: 'WAITING_INTERNAL',
      RESOLVED: 'RESOLVED',
      CLOSED: 'CLOSED',
    };

    const priorityMap: Record<string, TicketPriority> = {
      LOW: 'LOW',
      NORMAL: 'MEDIUM',
      HIGH: 'HIGH',
      URGENT: 'URGENT',
    };

    // If closing, set resolvedAt
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.status === 'CLOSED' && ticket.status !== 'CLOSED') {
      updateData.resolvedAt = new Date();
    }
    if (dto.status === 'RESOLVED' && ticket.status !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }
    if (dto.status) {
      updateData.status = statusMap[dto.status] ?? dto.status;
    }
    if (dto.priority) {
      updateData.priority = priorityMap[dto.priority] ?? dto.priority;
    }
    if (dto.assignedToId) updateData.assignedAdminId = dto.assignedToId;

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        requester: { select: { id: true, name: true, phone: true } },
        assignedAdmin: { select: { id: true, name: true } },
        booking: { select: { id: true, customerId: true, professionalId: true } },
      },
    });

    return updated;
  }

  /**
   * Add a message to a ticket.
   */
  async addMessage(
    actorId: string,
    actorRole: string,
    dto: {
      ticketId: string;
      body: string;
      attachments?: string[];
      isInternal?: boolean;
    },
  ): Promise<TicketMessage> {
    const ticket = await this.findById(dto.ticketId);

    // Check authorization - customer can only add to their own tickets
    if (actorRole === 'CUSTOMER' && ticket.requesterId !== actorId) {
      throw new TicketNotAuthorizedException('Not authorized to add message to this ticket');
    }

    // Check if ticket is closed
    if (ticket.status === 'CLOSED') {
      throw new TicketAlreadyClosedException(dto.ticketId);
    }

    // Don't allow internal messages from customers
    if (actorRole === 'CUSTOMER' && dto.isInternal) {
      throw new TicketNotAuthorizedException('Customers cannot add internal messages');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId: dto.ticketId,
        authorId: actorId,
        authorRole: actorRole as 'CUSTOMER' | 'PROFESSIONAL' | 'ADMIN' | 'SYSTEM',
        body: dto.body,
        attachments: dto.attachments ?? [],
        isInternal: dto.isInternal ?? false,
      },
    });

    // Update ticket status if customer replies to waiting ticket
    if (actorRole === 'CUSTOMER' && ticket.status === 'WAITING_CUSTOMER') {
      await this.prisma.supportTicket.update({
        where: { id: dto.ticketId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return message;
  }

  /**
   * List all tickets (admin view).
   */
  async listAll(query: {
    status?: string;
    category?: string;
    priority?: string;
    limit: number;
    offset: number;
  }): Promise<{ data: TicketWithRelations[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.priority) {
      const priorityMap: Record<string, TicketPriority> = {
        LOW: 'LOW',
        NORMAL: 'MEDIUM',
        HIGH: 'HIGH',
        URGENT: 'URGENT',
      };
      where.priority = priorityMap[query.priority] ?? 'MEDIUM';
    }
    // Category maps to type in schema
    if (query.category) {
      const categoryToType: Record<string, TicketType> = {
        BOOKING_ISSUE: 'BOOKING_ISSUE',
        PAYMENT_ISSUE: 'PAYMENT_ISSUE',
        PROFESSIONAL_CONDUCT: 'SAFETY_CONCERN',
        SERVICE_QUALITY: 'QUALITY_COMPLAINT',
        REFUND_REQUEST: 'PAYMENT_ISSUE',
        ACCOUNT_ISSUE: 'ACCOUNT_ISSUE',
        TECHNICAL_ISSUE: 'OTHER',
        OTHER: 'OTHER',
      };
      where.type = categoryToType[query.category] ?? 'OTHER';
    }

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          requester: { select: { id: true, name: true, phone: true } },
          assignedAdmin: { select: { id: true, name: true } },
          booking: { select: { id: true, customerId: true, professionalId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get support statistics (admin).
   */
  async getStats(): Promise<{
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    avgResolutionTimeHours: number | null;
    ticketsByCategory: Record<string, number>;
    ticketsByPriority: Record<string, number>;
  }> {
    const [
      openTickets,
      inProgressTickets,
      resolvedTickets,
      ticketsByType,
      ticketsByPriority,
      resolvedTicketsList,
    ] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      this.prisma.supportTicket.groupBy({ by: ['type'], _count: true }),
      this.prisma.supportTicket.groupBy({ by: ['priority'], _count: true }),
      this.prisma.supportTicket.findMany({
        where: { status: { in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
    ]);

    // Calculate average resolution time
    let avgResolutionTimeHours: number | null = null;
    if (resolvedTicketsList.length > 0) {
      const totalHours = resolvedTicketsList.reduce(
        (sum: number, t: { createdAt: Date; resolvedAt: Date | null }) => {
          const diff = t.resolvedAt!.getTime() - t.createdAt.getTime();
          return sum + diff / (1000 * 60 * 60);
        },
        0,
      );
      avgResolutionTimeHours = totalHours / resolvedTicketsList.length;
    }

    // Map type to category for display
    const typeToCategory: Record<string, string> = {
      BOOKING_ISSUE: 'BOOKING_ISSUE',
      PAYMENT_ISSUE: 'PAYMENT_ISSUE',
      SAFETY_CONCERN: 'PROFESSIONAL_CONDUCT',
      QUALITY_COMPLAINT: 'SERVICE_QUALITY',
      ACCOUNT_ISSUE: 'ACCOUNT_ISSUE',
      OTHER: 'OTHER',
    };

    return {
      openTickets,
      inProgressTickets,
      resolvedTickets,
      avgResolutionTimeHours,
      ticketsByCategory: ticketsByType.reduce(
        (acc: Record<string, number>, t: { type: string; _count: number }) => {
          acc[typeToCategory[t.type] ?? t.type] = t._count;
          return acc;
        },
        {},
      ),
      ticketsByPriority: ticketsByPriority.reduce(
        (acc: Record<string, number>, t: { priority: string; _count: number }) => {
          acc[t.priority] = t._count;
          return acc;
        },
        {},
      ),
    };
  }
}
