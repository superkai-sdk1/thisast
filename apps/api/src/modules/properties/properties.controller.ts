import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { PropertiesService } from './properties.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../common/types/jwt-payload.type.js';
import { PdfService } from '../pdf/pdf.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditAction } from '../../common/enums/audit-action.enum.js';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(
    private propertiesService: PropertiesService,
    private pdfService: PdfService,
    private auditLog: AuditLogService,
  ) {}

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('base') base?: 'own' | 'global' | 'agency',
    @Query('price_min') price_min?: number,
    @Query('price_max') price_max?: number,
    @Query('district') district?: string,
    @Query('rooms') rooms?: number[],
    @Query('area_min') area_min?: number,
    @Query('area_max') area_max?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() actor?: JwtPayload,
  ) {
    return this.propertiesService.findAll(
      { type, base, price_min, price_max, district, rooms, area_min, area_max, page, limit },
      actor!,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.propertiesService.findOne(id, actor);
  }

  @Post()
  create(@Body() dto: CreatePropertyDto, @CurrentUser() actor: JwtPayload) {
    return this.propertiesService.create(dto, actor);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePropertyDto>, @CurrentUser() actor: JwtPayload) {
    return this.propertiesService.update(id, dto, actor);
  }

  @Patch(':id/visibility')
  updateVisibility(
    @Param('id') id: string,
    @Body('visibility') visibility: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.propertiesService.updateVisibility(id, visibility, actor);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.propertiesService.softDelete(id, actor);
  }

  @Get(':id/matches')
  getMatches(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.propertiesService.getMatches(id, limit);
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @CurrentUser() actor: JwtPayload, @Res() res: Response) {
    const property = await this.propertiesService.findOne(id, actor);
    const agentResult = await this.pdfService.getAgentInfo(actor.sub);
    const pdf = await this.pdfService.generatePropertyCard(property, agentResult);

    await this.auditLog.log({
      actor_id: actor.sub,
      action_type: AuditAction.DOWNLOAD_PDF,
      target_type: 'property',
      target_id: id,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="property-${id}.pdf"`);
    res.send(pdf);
  }
}
