import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from '@crm/shared-core';
import { DemandsModule } from './demands/demands.module';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    DemandsModule,
  ],
})
export class AppModule {}
