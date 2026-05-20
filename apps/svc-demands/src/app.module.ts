import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@crm/shared-core';
import { RedisClientModule } from './redis-client.module';
import { DemandsModule } from './demands/demands.module';
import { TasksModule } from './tasks/tasks.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisClientModule,
    DatabaseModule,
    DemandsModule,
    TasksModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
