import { Controller, Post, Get, Delete, Body, Param, Inject, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import type { Request } from 'express';
import { REDIS_CLIENT } from '../../redis-client.module';
import { Public } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Public()
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return firstValueFrom(this.client.send(P.MSG_AUTH_LOGIN, body));
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: { refresh_token: string }) {
    return firstValueFrom(this.client.send(P.MSG_AUTH_REFRESH, body));
  }

  @Post('logout')
  logout(@Body() body: { refresh_token: string }) {
    return firstValueFrom(this.client.send(P.MSG_AUTH_LOGOUT, body));
  }

  // ── Passkey / WebAuthn ──────────────────────────────────────────────────────

  @Get('passkey/register-options')
  passkeyRegOptions(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_PASSKEY_REG_OPTIONS, { userId: user.sub }));
  }

  @Post('passkey/register')
  passkeyRegVerify(
    @CurrentUser() user: JwtPayload,
    @Body() body: { response: unknown; deviceName?: string },
  ) {
    return firstValueFrom(
      this.client.send(P.MSG_PASSKEY_REG_VERIFY, {
        userId: user.sub,
        response: body.response,
        deviceName: body.deviceName,
      }),
    );
  }

  @Public()
  @Post('passkey/login-options')
  passkeyAuthOptions(@Body() body: { email?: string }) {
    return firstValueFrom(this.client.send(P.MSG_PASSKEY_AUTH_OPTIONS, { email: body.email }));
  }

  @Public()
  @Post('passkey/login')
  passkeyAuthVerify(@Body() body: { challengeKey: string; response: unknown }, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? '';
    const userAgent = req.headers['user-agent'] ?? '';
    return firstValueFrom(
      this.client.send(P.MSG_PASSKEY_AUTH_VERIFY, {
        challengeKey: body.challengeKey,
        response: body.response,
        ip,
        userAgent,
      }),
    );
  }

  @Get('passkey/credentials')
  passkeyList(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send('passkey:list', { userId: user.sub }));
  }

  @Delete('passkey/credentials/:id')
  passkeyDelete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send('passkey:delete', { credId: id, userId: user.sub }));
  }
}
