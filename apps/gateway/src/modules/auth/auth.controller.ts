import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../app.module.js';
import { Public } from '../../common/guards/jwt.guard.js';
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
}
