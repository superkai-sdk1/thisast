import { Module } from '@nestjs/common';
import { DemandsController } from './demands.controller';

@Module({ controllers: [DemandsController] })
export class DemandsModule {}
