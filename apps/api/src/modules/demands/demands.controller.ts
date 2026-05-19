import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DemandsService } from './demands.service.js';
import { CreateDemandDto } from './dto/create-demand.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../common/types/jwt-payload.type.js';

@ApiTags('demands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('demands')
export class DemandsController {
  constructor(private demandsService: DemandsService) {}

  @Get()
  findAll(@CurrentUser() actor: JwtPayload, @Query('status') status?: string) {
    return this.demandsService.findAll(actor, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.demandsService.findOne(id, actor);
  }

  @Post()
  create(@Body() dto: CreateDemandDto, @CurrentUser() actor: JwtPayload) {
    return this.demandsService.create(dto, actor);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateDemandDto>, @CurrentUser() actor: JwtPayload) {
    return this.demandsService.update(id, dto, actor);
  }

  @Patch(':id/kanban-status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @CurrentUser() actor: JwtPayload) {
    return this.demandsService.updateKanbanStatus(id, status, actor);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.demandsService.delete(id, actor);
  }

  @Get(':id/matches')
  getMatches(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.demandsService.getMatches(id, limit);
  }

  @Get(':id/activity')
  getActivity(@Param('id') id: string) {
    return this.demandsService.getActivity(id);
  }

  @Post(':id/activity')
  addActivity(
    @Param('id') id: string,
    @Body('type') type: string,
    @Body('body') body: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.demandsService.addActivity(id, type, body, actor);
  }
}
