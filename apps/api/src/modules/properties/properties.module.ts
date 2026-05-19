import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { SearchModule } from '../search/search.module';
import { PdfModule } from '../pdf/pdf.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { MATCHING_QUEUE } from '../../queue/queue.constants';

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
