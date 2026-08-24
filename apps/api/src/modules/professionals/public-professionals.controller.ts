import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import type { ProfessionalAvailabilityResponse, PublicProfessional } from '@nest/types';
import { Public } from '../auth/decorators/public.decorator';
import { toAvailabilityWindow, toPublicProfessional } from './professionals.mapper';
import { ProfessionalsService } from './professionals.service';

/**
 * Customer-facing professional reads from 06_API_SPEC.md.
 *
 * Only APPROVED professionals are reachable — the filter is in the query, so an
 * unverified professional is never loaded, let alone rendered. An unverified id and
 * a nonexistent one both yield 404: whether someone has a pending application is
 * not public information.
 *
 * `GET /professionals` (the ranked discovery list) is deliberately absent. Its
 * ranking is the versioned, explainable matching function described in
 * 07_ARCHITECTURE.md, which belongs with the customer booking flow.
 *
 * `GET /professionals/:id/reviews` and `/portfolio` are likewise absent: reviews do
 * not exist yet, and portfolio has no table in 05_DATABASE.md.
 */
@Controller('professionals')
export class PublicProfessionalsController {
  constructor(private readonly professionals: ProfessionalsService) {}

  @Public()
  @Get(':id')
  async getProfessional(@Param('id', ParseUUIDPipe) id: string): Promise<PublicProfessional> {
    return toPublicProfessional(await this.professionals.getPublicProfessional(id));
  }

  /**
   * Weekly working windows.
   *
   * The timezone is returned alongside them because the windows are wall-clock
   * rules, not instants — a client cannot interpret `540` without knowing which
   * zone it belongs to.
   */
  @Public()
  @Get(':id/availability')
  async getAvailability(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProfessionalAvailabilityResponse> {
    const professional = await this.professionals.getPublicProfessional(id);
    const timezone = await this.professionals.getPublicTimezone();

    return {
      timezone,
      windows: (professional.availability ?? [])
        .filter((window) => window.active)
        .map(toAvailabilityWindow),
    };
  }
}
