import { Module } from '@nestjs/common';
import { DemandsController } from './demands.controller.js';
import { DemandsService } from './demands.service.js';

@Module({
  controllers: [DemandsController],
  providers: [DemandsService],
})
export class DemandsModule {}
