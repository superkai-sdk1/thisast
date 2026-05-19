import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from '@crm/shared-core';
import { MatchingModule } from './matching/matching.module';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ClientsModule.register([
      {
        name: REDIS_CLIENT,
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
      },
    ]),
    DatabaseModule,
    MatchingModule,
  ],
})
export class AppModule {}
