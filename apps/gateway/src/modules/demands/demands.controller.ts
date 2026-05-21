import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../redis-client.module';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('demands')
@ApiBearerAuth()
@Controller('demands')
export class DemandsController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  findAll(@Query() filter: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEMANDS_LIST, { filter, actor: user }));
  }

  @Get('trash')
  listTrash(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEMANDS_TRASH_LIST, { actor: user }));
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEMANDS_RESTORE, { id, actor: user }));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEMANDS_FIND_ONE, { id, actor: user }));
  }

  @Post()
  create(@Body() dto: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEMANDS_CREATE, { dto, actor: user }));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEMANDS_UPDATE, { id, dto, actor: user }));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEMANDS_DELETE, { id, actor: user }));
  }

  @Patch(':id/kanban-status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_DEMANDS_UPDATE_STATUS, { id, status: body.status, actor: user }));
  }

  @Get(':id/matches')
  getMatches(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_MATCHING_GET_DEMAND_MATCHES, { demandId: id }));
  }

  @Get(':id/activity')
  getActivity(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_DEMANDS_GET_ACTIVITY, { demandId: id }));
  }

  @Post(':id/activity')
  addActivity(@Param('id') id: string, @Body() body: { type: string; body: string }, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(
      this.client.send(P.MSG_DEMANDS_ADD_ACTIVITY, { demandId: id, type: body.type, body: body.body, actor: user }),
    );
  }

  @Get(':id/events')
  getEvents(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_DEMANDS_GET_EVENTS, { demandId: id }));
  }
}
