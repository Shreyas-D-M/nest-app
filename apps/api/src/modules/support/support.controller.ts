import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SupportService } from './support.service';
import {
  CreateTicketDtoClass,
  UpdateTicketDtoClass,
  AddMessageDtoClass,
  TicketListQueryDto,
  TicketResponseDtoClass,
  SupportStatsDtoClass,
} from './support.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  // =========================================================================
  // Customer endpoints
  // =========================================================================

  /**
   * POST /support/tickets — create a support ticket.
   */
  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @CurrentUser() user: User,
    @Body() dto: CreateTicketDtoClass,
  ): Promise<TicketResponseDtoClass> {
    const ticket = await this.support.create(user.id, dto);
    return this.mapToResponse(ticket);
  }

  /**
   * GET /support/tickets — list customer's tickets.
   */
  @Get('tickets')
  async listMyTickets(
    @CurrentUser() user: User,
    @Query() query: TicketListQueryDto,
  ): Promise<{ data: TicketResponseDtoClass[]; total: number }> {
    const { data, total } = await this.support.listByCustomer(user.id, query);
    return { data: data.map(this.mapToResponse), total };
  }

  /**
   * GET /support/tickets/:id — get a specific ticket.
   */
  @Get('tickets/:id')
  async getTicket(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<TicketResponseDtoClass> {
    const ticket = await this.support.findById(id);

    // Check authorization
    if (ticket.requesterId !== user.id && user.role !== 'ADMIN') {
      throw new Error('Not authorized to view this ticket');
    }

    return this.mapToResponse(ticket);
  }

  /**
   * POST /support/tickets/:id/messages — add a message to a ticket.
   */
  @Post('tickets/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  async addMessage(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: AddMessageDtoClass,
  ) {
    await this.support.addMessage(user.id, user.role, { ...dto, ticketId: id });
    return { success: true };
  }

  // =========================================================================
  // Admin endpoints
  // =========================================================================

  /**
   * GET /admin/support/tickets — list all tickets (admin).
   */
  @Get('admin/tickets')
  @Roles('ADMIN')
  async listAllTickets(
    @Query() query: TicketListQueryDto,
  ): Promise<{ data: TicketResponseDtoClass[]; total: number }> {
    const { data, total } = await this.support.listAll(query);
    return { data: data.map(this.mapToResponse), total };
  }

  /**
   * GET /admin/support/tickets/:id — get ticket (admin).
   */
  @Get('admin/tickets/:id')
  @Roles('ADMIN')
  async getTicketAdmin(@Param('id') id: string): Promise<TicketResponseDtoClass> {
    const ticket = await this.support.findById(id);
    return this.mapToResponse(ticket);
  }

  /**
   * PATCH /admin/support/tickets/:id — update ticket (admin).
   */
  @Patch('admin/tickets/:id')
  @Roles('ADMIN')
  async updateTicket(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDtoClass,
  ): Promise<TicketResponseDtoClass> {
    const ticket = await this.support.update(user.id, user.role, id, dto);
    return this.mapToResponse(ticket);
  }

  /**
   * GET /admin/support/stats — get support statistics.
   */
  @Get('admin/stats')
  @Roles('ADMIN')
  async getStats(): Promise<SupportStatsDtoClass> {
    return this.support.getStats();
  }

  private mapToResponse(
    ticket: Awaited<ReturnType<SupportService['findById']>>,
  ): TicketResponseDtoClass {
    // Map schema fields to DTO fields
    const typeToCategory: Record<
      string,
      | 'BOOKING_ISSUE'
      | 'PAYMENT_ISSUE'
      | 'QUALITY_COMPLAINT'
      | 'SAFETY_CONCERN'
      | 'ACCOUNT_ISSUE'
      | 'OTHER'
    > = {
      BOOKING_ISSUE: 'BOOKING_ISSUE',
      PAYMENT_ISSUE: 'PAYMENT_ISSUE',
      SAFETY_CONCERN: 'QUALITY_COMPLAINT', // Map SAFETY_CONCERN -> QUALITY_COMPLAINT for display
      QUALITY_COMPLAINT: 'QUALITY_COMPLAINT',
      ACCOUNT_ISSUE: 'ACCOUNT_ISSUE',
      OTHER: 'OTHER',
    };

    const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      URGENT: 'URGENT',
    };

    const statusMap: Record<
      string,
      'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'WAITING_INTERNAL' | 'RESOLVED' | 'CLOSED'
    > = {
      OPEN: 'OPEN',
      IN_PROGRESS: 'IN_PROGRESS',
      WAITING_CUSTOMER: 'WAITING_CUSTOMER',
      WAITING_INTERNAL: 'WAITING_INTERNAL',
      RESOLVED: 'RESOLVED',
      CLOSED: 'CLOSED',
    };

    // Extract subject from description (first line)
    const descriptionLines = ticket.description.split('\n\n');
    const subject = descriptionLines[0] || 'Support Ticket';
    const description = descriptionLines.slice(1).join('\n\n') || ticket.description;

    return {
      id: ticket.id,
      customerId: ticket.requesterId,
      bookingId: ticket.bookingId,
      category: typeToCategory[ticket.type] ?? 'OTHER',
      subject,
      description,
      status: statusMap[ticket.status] ?? ticket.status,
      priority: priorityMap[ticket.priority] ?? 'MEDIUM',
      assignedToId: ticket.assignedAdminId,
      attachments: [], // Not stored in schema currently
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      closedAt: ticket.resolvedAt,
      messages: ticket.messages.map((m) => ({
        id: m.id,
        ticketId: m.ticketId,
        authorId: m.authorId,
        authorRole: m.authorRole as 'CUSTOMER' | 'PROFESSIONAL' | 'ADMIN' | 'SYSTEM',
        body: m.body,
        attachments: m.attachments ?? [],
        isInternal: m.isInternal,
        createdAt: m.createdAt,
      })),
      customer: ticket.requester
        ? {
            id: ticket.requester.id,
            name: ticket.requester.name ?? null,
            phone: ticket.requester.phone,
          }
        : undefined,
      assignedTo: ticket.assignedAdmin
        ? { id: ticket.assignedAdmin.id, name: ticket.assignedAdmin.name }
        : undefined,
    };
  }
}
