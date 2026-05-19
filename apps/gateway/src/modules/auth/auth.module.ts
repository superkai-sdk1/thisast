import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from '../../common/guards/jwt.guard.js';
import { AuthController } from './auth.controller.js';

@Module({
  controllers: [AuthController],
  providers: [{ provide: APP_GUARD, useClass: JwtGuard }],
})
export class AuthModule {}
