import {
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import type {
  AdminCreateServiceInput,
  AdminUpdateServiceInput,
  AdminProfessionalListQueryInput,
  AdminAuditLogQueryInput,
  AdminApprovalInput,
  AdminReviewDecisionInput,
  AdminListQueryInput,
} from '@nest/validation';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // =========================================================================
  // Professional Verification
  // =========================================================================

  @Get('professionals')
  @ApiOperation({ summary: 'List professionals with optional verification status filter' })
  @ApiResponse({ status: 200, description: 'List of professionals' })
  async listProfessionals(@Query() query: AdminProfessionalListQueryInput) {
    return this.admin.listProfessionals(query);
  }

  @Get('professionals/:id')
  @ApiOperation({ summary: 'Get professional details with documents' })
  @ApiResponse({ status: 200, description: 'Professional details' })
  async getProfessional(@Param('id') id: string) {
    return this.admin.getProfessional(id);
  }

  @Post('professionals/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve professional verification' })
  @ApiResponse({ status: 200, description: 'Professional approved' })
  async approveProfessional(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() input: AdminApprovalInput,
  ) {
    return this.admin.approve(id, user.id, input);
  }

  @Post('professionals/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject professional verification' })
  @ApiResponse({ status: 200, description: 'Professional rejected' })
  async rejectProfessional(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() input: AdminReviewDecisionInput,
  ) {
    return this.admin.reject(id, user.id, input);
  }

  @Post('professionals/:id/request-changes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request changes to professional verification' })
  @ApiResponse({ status: 200, description: 'Changes requested' })
  async requestChangesProfessional(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() input: AdminReviewDecisionInput,
  ) {
    return this.admin.requestChanges(id, user.id, input);
  }

  @Get('professionals/:id/documents')
  @ApiOperation({ summary: 'Get signed URLs for professional documents' })
  @ApiResponse({ status: 200, description: 'Document signed URLs' })
  async getProfessionalDocuments(@Param('id') id: string) {
    const professional = await this.admin.getProfessional(id);
    const signedUrls = await this.admin.signDocumentUrls(professional);
    return Object.fromEntries(signedUrls);
  }

  // =========================================================================
  // Service Management
  // =========================================================================

  @Get('services')
  @ApiOperation({ summary: 'List all services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  async listServices(@Query() query: AdminListQueryInput) {
    return this.admin.listServices(query);
  }

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created' })
  async createService(@CurrentUser() user: User, @Body() input: AdminCreateServiceInput) {
    return this.admin.createService(user.id, input);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  async updateService(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() input: AdminUpdateServiceInput,
  ) {
    return this.admin.updateService(id, user.id, input);
  }

  // =========================================================================
  // Booking Management
  // =========================================================================

  @Get('bookings')
  @ApiOperation({ summary: 'List all bookings with filters' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async listBookings(
    @Query()
    query: AdminListQueryInput & {
      status?: string;
      customerId?: string;
      professionalId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    return this.admin.listBookings(query);
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Get booking details with full history' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  async getBooking(@Param('id') id: string) {
    return this.admin.getBooking(id);
  }

  @Post('bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking (admin)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  async cancelBooking(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { reason: string },
  ) {
    return this.admin.cancelBooking(id, user.id, body.reason);
  }

  // =========================================================================
  // Customer Management
  // =========================================================================

  @Get('customers')
  @ApiOperation({ summary: 'List all customers' })
  @ApiResponse({ status: 200, description: 'List of customers' })
  async listCustomers(@Query() query: AdminListQueryInput & { status?: string; search?: string }) {
    return this.admin.listCustomers(query);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer details with bookings' })
  @ApiResponse({ status: 200, description: 'Customer details' })
  async getCustomer(@Param('id') id: string) {
    return this.admin.getCustomer(id);
  }

  @Patch('customers/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update customer status (suspend/activate)' })
  @ApiResponse({ status: 200, description: 'Customer status updated' })
  async updateCustomerStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' },
  ) {
    return this.admin.updateCustomerStatus(id, user.id, body.status);
  }

  // =========================================================================
  // Payment Management
  // =========================================================================

  @Get('payments')
  @ApiOperation({ summary: 'List all payments with filters' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  async listPayments(
    @Query()
    query: AdminListQueryInput & {
      status?: string;
      provider?: string;
      fromDate?: string;
      toDate?: string;
      minAmount?: number;
      maxAmount?: number;
    },
  ) {
    return this.admin.listPayments(query);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  async getPayment(@Param('id') id: string) {
    return this.admin.getPayment(id);
  }

  @Post('payments/:id/refund')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate a refund for a payment' })
  @ApiResponse({ status: 201, description: 'Refund initiated' })
  async refundPayment(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { amountMinor?: number; reason: string },
  ) {
    return this.admin.refundPayment(id, user.id, body);
  }

  // =========================================================================
  // Audit Logs
  // =========================================================================

  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit logs with filters' })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  async listAuditLogs(@Query() query: AdminAuditLogQueryInput) {
    return this.admin.listAuditLogs(query);
  }

  // =========================================================================
  // Platform Statistics
  // =========================================================================

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  @ApiResponse({ status: 200, description: 'Platform statistics' })
  async getStats() {
    return this.admin.getStats();
  }
}
