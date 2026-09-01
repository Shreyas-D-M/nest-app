import { Injectable, Inject } from '@nestjs/common';
import type { PrismaClient, Review, ReviewTag, Booking, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ReviewNotFoundException,
  ReviewAlreadyExistsException,
  ReviewNotAuthorizedException,
  ReviewNotEligibleException,
} from './reviews.exceptions';

type Prisma = PrismaClient;

interface ReviewWithRelations extends Review {
  tags: ReviewTag[];
  customer: Pick<User, 'id' | 'name'>;
  booking: Pick<Booking, 'id' | 'status' | 'customerId' | 'professionalId'>;
}

@Injectable()
export class ReviewsService {
  constructor(@Inject(PrismaService) private readonly prisma: Prisma) {}

  /**
   * Submit a review for a completed booking.
   * Only the customer who booked can review, and only once per booking.
   */
  async create(
    customerId: string,
    dto: { bookingId: string; rating: number; comment?: string; tagIds?: string[] },
  ): Promise<ReviewWithRelations> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { professional: { include: { professional: true } } },
    });

    if (!booking) {
      throw new ReviewNotFoundException(`Booking ${dto.bookingId}`);
    }

    if (booking.customerId !== customerId) {
      throw new ReviewNotAuthorizedException('Only the booking customer can submit a review');
    }

    if (booking.status !== 'PAID' && booking.status !== 'REVIEWED') {
      throw new ReviewNotEligibleException('Booking must be paid or reviewed to submit a review');
    }

    // Check if review already exists
    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existingReview) {
      throw new ReviewAlreadyExistsException(dto.bookingId);
    }

    // Create review with tags
    const review = await this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        customerId,
        professionalId: booking.professionalId,
        rating: dto.rating,
        comment: dto.comment ?? '',
        tags: dto.tagIds?.length ? { create: dto.tagIds.map((tag) => ({ tag })) } : undefined,
      },
      include: {
        tags: true,
        customer: { select: { id: true, name: true } },
        booking: { select: { id: true, status: true, customerId: true, professionalId: true } },
      },
    });

    // Update booking status to REVIEWED if not already
    if (booking.status === 'PAID') {
      await this.prisma.booking.update({
        where: { id: dto.bookingId },
        data: { status: 'REVIEWED' },
      });
    }

    // Update professional rating
    await this.updateProfessionalRating(booking.professionalId);

    return review;
  }

  /**
   * Get a review by ID.
   */
  async findById(id: string): Promise<ReviewWithRelations> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        tags: true,
        customer: { select: { id: true, name: true } },
        booking: { select: { id: true, status: true, customerId: true, professionalId: true } },
      },
    });

    if (!review) {
      throw new ReviewNotFoundException(id);
    }

    return review;
  }

  /**
   * Get review by booking ID.
   */
  async findByBookingId(bookingId: string): Promise<ReviewWithRelations | null> {
    return this.prisma.review.findUnique({
      where: { bookingId },
      include: {
        tags: true,
        customer: { select: { id: true, name: true } },
        booking: { select: { id: true, status: true, customerId: true, professionalId: true } },
      },
    });
  }

  /**
   * Update a review (customer only, within a time window).
   */
  async update(
    customerId: string,
    reviewId: string,
    dto: { rating?: number; comment?: string; tagIds?: string[] },
  ): Promise<ReviewWithRelations> {
    const review = await this.findById(reviewId);

    if (review.customerId !== customerId) {
      throw new ReviewNotAuthorizedException('Only the review author can update');
    }

    // Only allow updates within 24 hours
    const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new ReviewNotAuthorizedException('Review can only be updated within 24 hours');
    }

    // Update tags if provided
    if (dto.tagIds) {
      // Delete existing tags and create new ones
      await this.prisma.reviewTag.deleteMany({ where: { reviewId } });
      if (dto.tagIds.length > 0) {
        await this.prisma.reviewTag.createMany({
          data: dto.tagIds.map((tag) => ({ reviewId, tag })),
        });
      }
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        tags: true,
        customer: { select: { id: true, name: true } },
        booking: { select: { id: true, status: true, customerId: true, professionalId: true } },
      },
    });

    // Update professional rating if rating changed
    if (dto.rating !== undefined) {
      await this.updateProfessionalRating(review.professionalId);
    }

    return updated;
  }

  /**
   * Delete a review (customer or admin).
   */
  async delete(actorId: string, actorType: 'CUSTOMER' | 'ADMIN', reviewId: string): Promise<void> {
    const review = await this.findById(reviewId);

    if (actorType === 'CUSTOMER' && review.customerId !== actorId) {
      throw new ReviewNotAuthorizedException('Only the review author can delete');
    }

    const professionalId = review.professionalId;

    await this.prisma.review.delete({ where: { id: reviewId } });

    // Reset booking status to PAID if it was REVIEWED
    await this.prisma.booking.update({
      where: { id: review.bookingId },
      data: { status: 'PAID' },
    });

    // Recalculate professional rating
    await this.updateProfessionalRating(professionalId);
  }

  /**
   * List reviews for a professional (for their profile).
   */
  async listByProfessional(
    professionalId: string,
    query: { status?: 'PUBLISHED' | 'HIDDEN'; limit: number; offset: number },
  ): Promise<{ data: ReviewWithRelations[]; total: number }> {
    // No status field on Review, so just filter by professionalId
    const where = { professionalId };

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          tags: true,
          customer: { select: { id: true, name: true } },
          booking: { select: { id: true, status: true, customerId: true, professionalId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * List reviews by a customer.
   */
  async listByCustomer(
    customerId: string,
    query: { limit: number; offset: number },
  ): Promise<{ data: ReviewWithRelations[]; total: number }> {
    const where = { customerId };

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          tags: true,
          customer: { select: { id: true, name: true } },
          booking: { select: { id: true, status: true, customerId: true, professionalId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get review statistics for a professional.
   */
  async getStats(professionalId: string): Promise<{
    averageRating: number | null;
    totalReviews: number;
    ratingDistribution: Record<string, number>;
    topTags: Array<{ tagId: string; name: string; count: number }>;
  }> {
    const reviews = await this.prisma.review.findMany({
      where: { professionalId },
      include: { tags: true },
    });

    if (reviews.length === 0) {
      return {
        averageRating: null,
        totalReviews: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        topTags: [],
      };
    }

    const totalReviews = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = sum / totalReviews;

    const ratingDistribution = reviews.reduce(
      (acc, r) => {
        acc[r.rating.toString()] = (acc[r.rating.toString()] || 0) + 1;
        return acc;
      },
      { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as Record<string, number>,
    );

    // Count tag occurrences - ReviewTag uses `tag` field as the name
    const tagCounts = new Map<string, { name: string; count: number }>();
    for (const review of reviews) {
      for (const tag of review.tags) {
        const existing = tagCounts.get(tag.tag) || { name: tag.tag, count: 0 };
        existing.count += 1;
        tagCounts.set(tag.tag, existing);
      }
    }

    const topTags = Array.from(tagCounts.entries())
      .map(([name, { count }]) => ({ tagId: name, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { averageRating, totalReviews, ratingDistribution, topTags };
  }

  /**
   * List all review tags.
   */
  async listTags(): Promise<{ tag: string }[]> {
    return this.prisma.reviewTag.findMany({
      distinct: ['tag'],
      orderBy: { tag: 'asc' },
      select: { tag: true },
    });
  }

  /**
   * Update professional's average rating based on published reviews.
   */
  private async updateProfessionalRating(professionalId: string): Promise<void> {
    const result = await this.prisma.review.aggregate({
      where: { professionalId },
      _avg: { rating: true },
    });

    await this.prisma.professional.update({
      where: { id: professionalId },
      data: { rating: result._avg.rating ?? null },
    });
  }
}
