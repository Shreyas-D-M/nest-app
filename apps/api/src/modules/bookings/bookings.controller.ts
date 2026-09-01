import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { CustomerBookingView, ProfessionalJobView } from '@nest/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BookingCreateDto,
  BookingCancelDto,
  ExtraWorkApprovalDto,
  BookingReviewDto,
  BookingListQueryDto,
  ProfessionalJobListQueryDto,
  ProfessionalJobAcceptDto,
  ProfessionalJobDeclineDto,
  ProfessionalExtraWorkDto,
  ProfessionalJobActionDto,
} from './bookings.dto';
import { toCustomerBookingView, toProfessionalJobView } from './bookings.mapper';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly prisma: PrismaService,
  ) {}

  // =========================================================================
  // Customer endpoints
  // =========================================================================

  /**
   * POST /bookings — create a new booking from a service request.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: User,
    @Body() dto: BookingCreateDto,
  ): Promise<CustomerBookingView> {
    const booking = await this.bookings.create(user.id, dto);
    return toCustomerBookingView(booking);
  }

  /**
   * GET /bookings — list customer's bookings.
   */
  @Get()
  async list(
    @CurrentUser() user: User,
    @Query() query: BookingListQueryDto,
  ): Promise<{ data: CustomerBookingView[]; total: number }> {
    const { data, total } = await this.bookings.listByCustomer(
      user.id,
      query.status,
      query.limit,
      query.offset,
    );

    return {
      data: data.map(toCustomerBookingView),
      total,
    };
  }

  /**
   * GET /bookings/:id — get a specific booking.
   */
  @Get(':id')
  async getById(@CurrentUser() user: User, @Param('id') id: string): Promise<CustomerBookingView> {
    const booking = await this.bookings.getById(id, user.id);
    return toCustomerBookingView(booking);
  }

  /**
   * POST /bookings/:id/cancel — cancel a booking.
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: BookingCancelDto,
  ): Promise<CustomerBookingView> {
    const booking = await this.bookings.cancelByCustomer(id, user.id, dto);
    return toCustomerBookingView(booking);
  }

  /**
   * POST /bookings/:id/confirm-extra-work — approve extra work.
   */
  @Post(':id/confirm-extra-work')
  @HttpCode(HttpStatus.OK)
  async confirmExtraWork(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ExtraWorkApprovalDto,
  ): Promise<CustomerBookingView> {
    // Extract extra work ID from query or body - for now assume single pending
    const booking = await this.bookings.getById(id, user.id);
    const pendingExtra = booking.extraWorkReqs.find((ewr) => ewr.status === 'PENDING');
    if (!pendingExtra) {
      // Throw appropriate exception
      throw new Error('No pending extra work request');
    }

    const updated = await this.bookings.respondToExtraWork(id, user.id, pendingExtra.id, dto);
    return toCustomerBookingView(updated);
  }

  /**
   * POST /bookings/:id/reject-extra-work — reject extra work.
   */
  @Post(':id/reject-extra-work')
  @HttpCode(HttpStatus.OK)
  async rejectExtraWork(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ExtraWorkApprovalDto,
  ): Promise<CustomerBookingView> {
    const booking = await this.bookings.getById(id, user.id);
    const pendingExtra = booking.extraWorkReqs.find((ewr) => ewr.status === 'PENDING');
    if (!pendingExtra) {
      throw new Error('No pending extra work request');
    }

    const updated = await this.bookings.respondToExtraWork(id, user.id, pendingExtra.id, {
      ...dto,
      approved: false,
    });
    return toCustomerBookingView(updated);
  }

  /**
   * POST /bookings/:id/review — submit a review.
   */
  @Post(':id/review')
  @HttpCode(HttpStatus.CREATED)
  async review(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: BookingReviewDto,
  ): Promise<{ success: boolean }> {
    await this.bookings.submitReview(id, user.id, dto);
    return { success: true };
  }

  /**
   * POST /bookings/:id/payment — initiate payment.
   */
  @Post(':id/payment')
  @HttpCode(HttpStatus.CREATED)
  async initiatePayment(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<{
    providerPaymentId: string;
    checkoutUrl: string;
  }> {
    return this.bookings.initiatePayment(id, user.id);
  }

  // =========================================================================
  // Professional endpoints
  // =========================================================================

  /**
   * GET /professional/jobs — list professional's assigned jobs.
   */
  @Get('professional/jobs')
  async listJobs(
    @CurrentUser() user: User,
    @Query() query: ProfessionalJobListQueryDto,
  ): Promise<{ data: ProfessionalJobView[]; total: number }> {
    // Get professional ID from user
    const professional = await this.prisma.professional.findUnique({
      where: { userId: user.id },
    });
    if (!professional) {
      throw new Error('Professional profile not found');
    }

    const { data, total } = await this.bookings.listByProfessional(
      professional.id,
      query.status,
      query.limit,
      query.offset,
    );

    return {
      data: data.map(toProfessionalJobView),
      total,
    };
  }

  /**
   * GET /professional/jobs/:id — get job details.
   */
  @Get('professional/jobs/:id')
  async getJob(@CurrentUser() user: User, @Param('id') id: string): Promise<ProfessionalJobView> {
    const professional = await this.prisma.professional.findUnique({
      where: { userId: user.id },
    });
    if (!professional) {
      throw new Error('Professional profile not found');
    }

    const booking = await this.bookings.getJobById(id, professional.id);
    return toProfessionalJobView(booking);
  }

  /**
   * POST /professional/jobs/:id/accept — accept a job.
   */
  @Post('professional/jobs/:id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptJob(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ProfessionalJobAcceptDto,
  ): Promise<ProfessionalJobView> {
    const professional = await this.prisma.professional.findUnique({
      where: { userId: user.id },
    });
    if (!professional) throw new Error('Professional profile not found');

    const booking = await this.bookings.acceptJob(id, professional.id, dto);
    return toProfessionalJobView(booking);
  }

  /**
   * POST /professional/jobs/:id/decline — decline a job.
   */
  @Post('professional/jobs/:id/decline')
  @HttpCode(HttpStatus.OK)
  async declineJob(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ProfessionalJobDeclineDto,
  ): Promise<ProfessionalJobView> {
    const professional = await this.prisma.professional.findUnique({
      where: { userId: user.id },
    });
    if (!professional) throw new Error('Professional profile not found');

    const booking = await this.bookings.declineJob(id, professional.id, dto);
    return toProfessionalJobView(booking);
  }

  /**
   * POST /professional/jobs/:id/arrived — mark as arrived.
   */
  @Post('professional/jobs/:id/arrived')
  @HttpCode(HttpStatus.OK)
  async markArrived(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() _dto: ProfessionalJobActionDto,
  ): Promise<ProfessionalJobView> {
    const professional = await this.prisma.professional.findUnique({
      where: { userId: user.id },
    });
    if (!professional) throw new Error('Professional profile not found');

    const booking = await this.bookings.markArrived(id, professional.id);
    return toProfessionalJobView(booking);
  }

  /**
   * POST /professional/jobs/:id/start — start the job.
   */
  @Post('professional/jobs/:id/start')
  @HttpCode(HttpStatus.OK)
  async startJob(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() _dto: ProfessionalJobActionDto,
  ): Promise<ProfessionalJobView> {
    const professional = await this.prisma.professional.findUnique({
      where: { userId: user.id },
    });
    if (!professional) throw new Error('Professional profile not found');

    const booking = await this.bookings.startJob(id, professional.id);
    return toProfessionalJobView(booking);
  }

  /**
   * POST /professional/jobs/:id/extra-work — propose extra work.
   */
  @Post('professional/jobs/:id/extra-work')
  @HttpCode(HttpStatus.CREATED)
  async proposeExtraWork(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ProfessionalExtraWorkDto,
  ): Promise<ProfessionalJobView> {
    const professional = await this.prisma.professional.findUnique({
      where: { userId: user.id },
    });
    if (!professional) throw new Error('Professional profile not found');

    const booking = await this.bookings.proposeExtraWork(id, professional.id, dto);
    return toProfessionalJobView(booking);
  }

  /**
   * POST /professional/jobs/:id/complete — complete the job.
   */
  @Post('professional/jobs/:id/complete')
  @HttpCode(HttpStatus.OK)
  async completeJob(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() _dto: ProfessionalJobActionDto,
  ): Promise<ProfessionalJobView> {
    const professional = await this.prisma.professional.findUnique({
      where: { userId: user.id },
    });
    if (!professional) throw new Error('Professional profile not found');

    const booking = await this.bookings.completeJob(id, professional.id);
    return toProfessionalJobView(booking);
  }
}
