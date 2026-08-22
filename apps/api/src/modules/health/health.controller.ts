import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { LivenessResponse, ReadinessResponse } from '@nest/types';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Liveness probe. Always 200 while the process can serve a request. */
  @Get()
  getLiveness(): LivenessResponse {
    return this.health.getLiveness();
  }

  /**
   * Readiness probe.
   *
   * Responds 503 when a dependency is down so that a load balancer or
   * orchestrator stops routing traffic here, while still returning the full body
   * so an operator can see which dependency failed.
   */
  @Get('ready')
  async getReadiness(@Res({ passthrough: true }) response: Response): Promise<ReadinessResponse> {
    const readiness = await this.health.getReadiness();

    response.status(readiness.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return readiness;
  }
}
