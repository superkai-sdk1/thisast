import { Module } from '@nestjs/common';
import { DealsController } from './deals.controller.js';

@Module({ controllers: [DealsController] })
export class DealsModule {}
