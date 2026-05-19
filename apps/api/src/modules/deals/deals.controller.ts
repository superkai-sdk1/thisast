import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DealsService, CreateDealDto, CreateSplitDto } from './deals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Get('summary')
  getSummary(@CurrentUser() actor: JwtPayload) {
    return this.dealsService.getSummary(actor);
  }

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.dealsService.findAll(actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.dealsService.findOne(id, actor);
  }

  @Post()
  create(@Body() dto: CreateDealDto, @CurrentUser() actor: JwtPayload) {
    return this.dealsService.create(dto, actor);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateDealDto>, @CurrentUser() actor: JwtPayload) {
    return this.dealsService.update(id, dto, actor);
  }

  @Get(':id/commission-splits')
  getSplits(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.dealsService.getSplits(id, actor);
  }

  @Post(':id/commission-splits')
  addSplit(@Param('id') id: string, @Body() dto: CreateSplitDto, @CurrentUser() actor: JwtPayload) {
    return this.dealsService.addSplit(id, dto, actor);
  }

  @Delete(':id/commission-splits/:splitId')
  deleteSplit(@Param('id') id: string, @Param('splitId') splitId: string, @CurrentUser() actor: JwtPayload) {
    return this.dealsService.deleteSplit(id, splitId, actor);
  }
}
