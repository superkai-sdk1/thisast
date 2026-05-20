import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../redis-client.module';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  findAll(@Query() filter: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_TASKS_LIST, { filter, actorId: user.sub }));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_TASKS_FIND_ONE, { id, actorId: user.sub }));
  }

  @Post()
  create(@Body() dto: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_TASKS_CREATE, { dto, actor: user }));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return firstValueFrom(this.client.send(P.MSG_TASKS_UPDATE, { id, dto }));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_TASKS_DELETE, { id, actorId: user.sub }));
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_TASKS_GET_COMMENTS, { taskId: id }));
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body('body') body: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_TASKS_ADD_COMMENT, { taskId: id, body, actorId: user.sub }));
  }
}
