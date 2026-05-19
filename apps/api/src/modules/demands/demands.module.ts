import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DemandsController } from './demands.controller.js';
import { DemandsService } from './demands.service.js';
import { MATCHING_QUEUE } from '../../queue/queue.constants.js';

@Module({
  imports: [BullModule.registerQueue({ name: MATCHING_QUEUE })],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService],
})
export class DemandsModule {}
