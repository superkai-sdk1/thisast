import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DemandsController } from './demands.controller';
import { DemandsService } from './demands.service';
import { MATCHING_QUEUE } from '../../queue/queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: MATCHING_QUEUE })],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService],
})
export class DemandsModule {}
