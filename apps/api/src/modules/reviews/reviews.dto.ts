import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ReviewTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  category: z.enum([
    'QUALITY',
    'PUNCTUALITY',
    'COMMUNICATION',
    'VALUE',
    'CLEANLINESS',
    'PROFESSIONALISM',
  ]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ReviewTagListSchema = z.array(ReviewTagSchema);

export const CreateReviewDtoSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  tagIds: z.array(z.string().uuid()).max(10).optional(),
});

export const UpdateReviewDtoSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
  tagIds: z.array(z.string().uuid()).max(10).optional(),
});

export const ReviewResponseDtoSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  customerId: z.string().uuid(),
  professionalId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  tags: z.array(ReviewTagSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  customer: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
});

export const ProfessionalReviewsQuerySchema = z.object({
  status: z.enum(['PUBLISHED', 'HIDDEN']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const CustomerReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ReviewStatsDtoSchema = z.object({
  averageRating: z.number().nullable(),
  totalReviews: z.number().int(),
  ratingDistribution: z.record(z.string(), z.number().int()),
  topTags: z.array(
    z.object({
      tagId: z.string().uuid(),
      name: z.string(),
      count: z.number().int(),
    }),
  ),
});

export type ReviewTag = z.infer<typeof ReviewTagSchema>;
export type CreateReviewDto = z.infer<typeof CreateReviewDtoSchema>;
export type UpdateReviewDto = z.infer<typeof UpdateReviewDtoSchema>;
export type ReviewResponseDto = z.infer<typeof ReviewResponseDtoSchema>;
export type ProfessionalReviewsQuery = z.infer<typeof ProfessionalReviewsQuerySchema>;
export type CustomerReviewsQuery = z.infer<typeof CustomerReviewsQuerySchema>;
export type ReviewStatsDto = z.infer<typeof ReviewStatsDtoSchema>;

export class ReviewTagDto extends createZodDto(ReviewTagSchema) {}
export class CreateReviewDtoClass extends createZodDto(CreateReviewDtoSchema) {}
export class UpdateReviewDtoClass extends createZodDto(UpdateReviewDtoSchema) {}
export class ReviewResponseDtoClass extends createZodDto(ReviewResponseDtoSchema) {}
export class ProfessionalReviewsQueryDto extends createZodDto(ProfessionalReviewsQuerySchema) {}
export class CustomerReviewsQueryDto extends createZodDto(CustomerReviewsQuerySchema) {}
export class ReviewStatsDtoClass extends createZodDto(ReviewStatsDtoSchema) {}
