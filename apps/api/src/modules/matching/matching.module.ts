import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { MatchingService } from './matching.service.js';
import { MatchingProcessor } from './matching.processor.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { MATCHING_QUEUE } from '../../queue/queue.constants.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: MATCHING_QUEUE }),
    NotificationsModule,
  ],
  providers: [MatchingService, MatchingProcessor],
  exports: [MatchingService],
})
export class MatchingModule {}
