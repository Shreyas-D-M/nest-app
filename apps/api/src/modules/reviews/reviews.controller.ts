import {
  Body,
  Controller,
  Delete,
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
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDtoClass,
  UpdateReviewDtoClass,
  ProfessionalReviewsQueryDto,
  CustomerReviewsQueryDto,
  ReviewResponseDtoClass,
  ReviewStatsDtoClass,
} from './reviews.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  // =========================================================================
  // Customer endpoints
  // =========================================================================

  /**
   * POST /reviews — submit a review for a completed booking.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateReviewDtoClass,
  ): Promise<ReviewResponseDtoClass> {
    const review = await this.reviews.create(user.id, dto);
    return this.mapToResponse(review);
  }

  /**
   * GET /reviews — list current customer's reviews.
   */
  @Get()
  async listMyReviews(
    @CurrentUser() user: User,
    @Query() query: CustomerReviewsQueryDto,
  ): Promise<{ data: ReviewResponseDtoClass[]; total: number }> {
    const { data, total } = await this.reviews.listByCustomer(user.id, query);
    return { data: data.map(this.mapToResponse), total };
  }

  /**
   * GET /reviews/:id — get a specific review.
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<ReviewResponseDtoClass> {
    const review = await this.reviews.findById(id);
    return this.mapToResponse(review);
  }

  /**
   * PATCH /reviews/:id — update a review (within 24 hours).
   */
  @Patch(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDtoClass,
  ): Promise<ReviewResponseDtoClass> {
    const review = await this.reviews.update(user.id, id, dto);
    return this.mapToResponse(review);
  }

  /**
   * DELETE /reviews/:id — delete a review.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    await this.reviews.delete(user.id, 'CUSTOMER', id);
  }

  // =========================================================================
  // Professional endpoints
  // =========================================================================

  /**
   * GET /professional/reviews — list reviews for the authenticated professional.
   */
  @Get('professional/reviews')
  @Roles('PROFESSIONAL')
  async listProfessionalReviews(
    @CurrentUser() user: User,
    @Query() query: ProfessionalReviewsQueryDto,
  ): Promise<{ data: ReviewResponseDtoClass[]; total: number }> {
    // Get professional ID from user
    const professional = await this.reviews['prisma'].professional.findUnique({
      where: { userId: user.id },
    });
    if (!professional) {
      throw new Error('Professional profile not found');
    }

    const { data, total } = await this.reviews.listByProfessional(professional.id, query);
    return { data: data.map(this.mapToResponse), total };
  }

  /**
   * GET /professional/reviews/stats — get review statistics for the professional.
   */
  @Get('professional/reviews/stats')
  @Roles('PROFESSIONAL')
  async getProfessionalStats(@CurrentUser() user: User): Promise<ReviewStatsDtoClass> {
    const professional = await this.reviews['prisma'].professional.findUnique({
      where: { userId: user.id },
    });
    if (!professional) {
      throw new Error('Professional profile not found');
    }

    return this.reviews.getStats(professional.id);
  }

  // =========================================================================
  // Public endpoints
  // =========================================================================

  /**
   * GET /reviews/tags — list all available review tags.
   */
  @Get('tags')
  async listTags(): Promise<{ tag: string }[]> {
    return this.reviews.listTags();
  }

  /**
   * GET /professionals/:professionalId/reviews — public reviews for a professional.
   */
  @Get('professionals/:professionalId/reviews')
  async listPublicReviews(
    @Param('professionalId') professionalId: string,
    @Query() query: ProfessionalReviewsQueryDto,
  ): Promise<{ data: ReviewResponseDtoClass[]; total: number }> {
    const { data, total } = await this.reviews.listByProfessional(professionalId, {
      ...query,
      // No status field, so we don't filter
    });
    return { data: data.map(this.mapToResponse), total };
  }

  /**
   * GET /professionals/:professionalId/reviews/stats — public review stats.
   */
  @Get('professionals/:professionalId/reviews/stats')
  async getPublicStats(
    @Param('professionalId') professionalId: string,
  ): Promise<ReviewStatsDtoClass> {
    return this.reviews.getStats(professionalId);
  }

  // =========================================================================
  // Admin endpoints
  // =========================================================================

  /**
   * DELETE /admin/reviews/:id — admin delete review.
   */
  @Delete('admin/reviews/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminDelete(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    await this.reviews.delete(user.id, 'ADMIN', id);
  }

  private mapToResponse(
    review: Awaited<ReturnType<ReviewsService['findById']>>,
  ): ReviewResponseDtoClass {
    return {
      id: review.id,
      bookingId: review.bookingId,
      customerId: review.customerId,
      professionalId: review.professionalId,
      rating: review.rating,
      comment: review.comment ?? '',
      tags: review.tags.map((t) => ({
        id: t.id,
        name: t.tag,
        category: 'QUALITY' as const,
        createdAt: t.createdAt,
        updatedAt: t.createdAt,
      })),
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      customer: { id: review.customer.id, name: review.customer.name ?? '' },
    };
  }
}
