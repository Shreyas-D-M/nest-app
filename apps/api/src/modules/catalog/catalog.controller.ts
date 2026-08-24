import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import type { CatalogResponse, ServiceDetail } from '@nest/types';
import { Public } from '../auth/decorators/public.decorator';
import { CatalogService } from './catalog.service';
import { toCatalogResponse, toServiceDetail } from './catalog.mapper';

/**
 * `GET /services` and `GET /services/:id` from 06_API_SPEC.md.
 *
 * Public: a customer browses what NEST can help with before signing in, and
 * 04_DESIGN_SYSTEM.md puts quick categories on the home screen.
 *
 * There is no `/categories` endpoint because 06_API_SPEC.md defines none;
 * categories appear only as the grouping inside this response.
 */
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('services')
  async getServices(): Promise<CatalogResponse> {
    return toCatalogResponse(await this.catalog.getCatalog());
  }

  @Public()
  @Get('services/:id')
  async getService(@Param('id', ParseUUIDPipe) id: string): Promise<ServiceDetail> {
    return toServiceDetail(await this.catalog.getActiveServiceById(id));
  }
}
