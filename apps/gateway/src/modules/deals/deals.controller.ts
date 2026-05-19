import { Controller, Get, Post, Patch, Delete, Param, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../app.module.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('deals')
@ApiBearerAuth()
@Controller('deals')
export class DealsController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Get('summary')
  summary(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEALS_SUMMARY, { user }));
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEALS_LIST, { user }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_DEALS_FIND_ONE, { id }));
  }

  @Post()
  create(@Body() dto: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEALS_CREATE, { dto, user }));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return firstValueFrom(this.client.send(P.MSG_DEALS_UPDATE, { id, dto }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_DEALS_DELETE, { id }));
  }
}
