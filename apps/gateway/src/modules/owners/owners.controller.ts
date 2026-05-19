import { Controller, Get, Post, Patch, Delete, Param, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../app.module.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('owners')
@ApiBearerAuth()
@Controller('owners')
export class OwnersController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_OWNERS_LIST, { agencyId: user.agencyId }));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_OWNERS_FIND_ONE, { id, user }));
  }

  @Post()
  create(@Body() dto: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_OWNERS_CREATE, { dto, user }));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return firstValueFrom(this.client.send(P.MSG_OWNERS_UPDATE, { id, dto }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_OWNERS_DELETE, { id }));
  }
}
