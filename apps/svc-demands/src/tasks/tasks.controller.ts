import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MSG_TASKS_LIST,
  MSG_TASKS_FIND_ONE,
  MSG_TASKS_CREATE,
  MSG_TASKS_UPDATE,
  MSG_TASKS_DELETE,
  MSG_TASKS_GET_COMMENTS,
  MSG_TASKS_ADD_COMMENT,
} from '@crm/shared-types';
import { TasksService } from './tasks.service';
import type { CreateTaskDto, UpdateTaskDto, TaskFilter } from './tasks.service';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @MessagePattern(MSG_TASKS_LIST)
  list(@Payload() data: { filter?: TaskFilter; actorId: string }) {
    return this.tasksService.findAll(data.filter ?? {});
  }

  @MessagePattern(MSG_TASKS_FIND_ONE)
  findOne(@Payload() data: { id: string; actorId: string }) {
    return this.tasksService.findOne(data.id);
  }

  @MessagePattern(MSG_TASKS_CREATE)
  create(@Payload() data: { dto: CreateTaskDto; actor: { sub: string } }) {
    return this.tasksService.create(data.dto, data.actor.sub);
  }

  @MessagePattern(MSG_TASKS_UPDATE)
  update(@Payload() data: { id: string; dto: UpdateTaskDto }) {
    return this.tasksService.update(data.id, data.dto);
  }

  @MessagePattern(MSG_TASKS_DELETE)
  delete(@Payload() data: { id: string; actorId: string }) {
    return this.tasksService.delete(data.id, data.actorId);
  }

  @MessagePattern(MSG_TASKS_GET_COMMENTS)
  getComments(@Payload() data: { taskId: string }) {
    return this.tasksService.getComments(data.taskId);
  }

  @MessagePattern(MSG_TASKS_ADD_COMMENT)
  addComment(@Payload() data: { taskId: string; body: string; actorId: string }) {
    return this.tasksService.addComment(data.taskId, data.body, data.actorId);
  }
}
