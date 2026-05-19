import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { MatchingService } from './matching.service';
import { MatchingProcessor } from './matching.processor';
import { NotificationsModule } from '../notifications/notifications.module';
import { MATCHING_QUEUE } from '../../queue/queue.constants';

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
