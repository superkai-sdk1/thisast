import { Module } from '@nestjs/common';
import { DemandsController } from './demands.controller.js';

@Module({ controllers: [DemandsController] })
export class DemandsModule {}
