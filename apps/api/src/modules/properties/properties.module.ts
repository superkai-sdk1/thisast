import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PropertiesController } from './properties.controller.js';
import { PropertiesService } from './properties.service.js';
import { SearchModule } from '../search/search.module.js';
import { PdfModule } from '../pdf/pdf.module.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { MATCHING_QUEUE } from '../../queue/queue.constants.js';

@Module({
  imports: [
    SearchModule,
    PdfModule,
    AuditLogModule,
    BullModule.registerQueue({ name: MATCHING_QUEUE }),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
