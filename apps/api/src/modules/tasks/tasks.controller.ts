import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, AddCommentDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigned_to') assigned_to?: string,
    @Query('demand_id') demand_id?: string,
    @Query('property_id') property_id?: string,
    @Query('complex_id') complex_id?: string,
    @Query('deal_id') deal_id?: string,
    @Query('due_before') due_before?: string,
    @Query('due_after') due_after?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasksService.findAll(actor, {
      status, priority, assigned_to,
      demand_id, property_id, complex_id, deal_id,
      due_before, due_after,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.tasksService.findOne(id, actor);
  }

  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser() actor: JwtPayload) {
    return this.tasksService.create(dto, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.tasksService.update(id, dto, actor);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.tasksService.delete(id, actor);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    void actor;
    return this.tasksService.getComments(id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.tasksService.addComment(id, dto.body, actor);
  }
}
