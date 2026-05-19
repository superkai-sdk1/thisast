import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from '@crm/shared-core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-secret-change-in-prod',
    }),
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
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
