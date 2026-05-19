import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { OwnersService, CreateOwnerDto } from './owners.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('owners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('owners')
export class OwnersController {
  constructor(private ownersService: OwnersService) {}

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.ownersService.findAll(actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload, @Req() req: Request) {
    return this.ownersService.findOne(id, actor, req.ip, req.headers['user-agent']);
  }

  @Post()
  create(@Body() dto: CreateOwnerDto, @CurrentUser() actor: JwtPayload) {
    return this.ownersService.create(dto, actor);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateOwnerDto>) {
    return this.ownersService.update(id, dto);
  }
}
