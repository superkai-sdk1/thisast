import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@crm/shared-core';
import { DealsModule } from './deals/deals.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    DealsModule,
  ],
})
export class AppModule {}
