import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@crm/shared-core';
import { RedisClientModule } from './redis-client.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
    }),
    RedisClientModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
