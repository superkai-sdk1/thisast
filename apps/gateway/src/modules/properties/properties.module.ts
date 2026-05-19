import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller.js';

@Module({ controllers: [PropertiesController] })
export class PropertiesModule {}
