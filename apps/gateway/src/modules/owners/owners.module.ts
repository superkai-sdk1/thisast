import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller.js';

@Module({ controllers: [OwnersController] })
export class OwnersModule {}
