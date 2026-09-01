import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';

/**
 * Service requests module.
 *
 * Provides customer service request functionality: create requests from natural
 * language, attach photos, and track request status through AI classification
 * to booking matching.
 */
@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
