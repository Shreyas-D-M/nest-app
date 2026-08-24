import { Module } from '@nestjs/common';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { PublicProfessionalsController } from './public-professionals.controller';

/**
 * Two controllers, one service.
 *
 * The split mirrors the trust boundary: `/professional/*` is the owner's private
 * surface, `/professionals/*` is what customers may read. Keeping them in separate
 * classes makes it obvious in review which routes are public.
 */
@Module({
  controllers: [ProfessionalsController, PublicProfessionalsController],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
