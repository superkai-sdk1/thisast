import { Controller, Get, Post, Patch, Param, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../app.module';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_NOTIF_LIST, { userId: user.sub }));
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_NOTIF_MARK_READ, { id }));
  }

  @Patch('read-all')
  markAll(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_NOTIF_MARK_ALL, { userId: user.sub }));
  }

  @Post('subscribe')
  subscribe(@Body() subscription: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_NOTIF_SUBSCRIBE, { subscription, userId: user.sub }));
  }
}
