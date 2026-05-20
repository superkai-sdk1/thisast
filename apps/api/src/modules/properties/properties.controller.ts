import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { PdfService } from '../pdf/pdf.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';

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
    @Query('status') status?: string,
    @Query('listing_type') listing_type?: string,
    @Query('price_min') price_min?: number,
    @Query('price_max') price_max?: number,
    @Query('district') district?: string,
    @Query('rooms') rooms?: number[],
    @Query('area_min') area_min?: number,
    @Query('area_max') area_max?: number,
    @Query('renovation') renovation?: string,
    @Query('has_loggia') has_loggia?: string,
    @Query('has_balcony') has_balcony?: string,
    @Query('has_wardrobe') has_wardrobe?: string,
    @Query('has_panoramic') has_panoramic?: string,
    @Query('from_realtor') from_realtor?: string,
    @Query('display_id') display_id?: string,
    @Query('complex_id') complex_id?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() actor?: JwtPayload,
  ) {
    return this.propertiesService.findAll(
      {
        type, base, status, listing_type,
        price_min, price_max, district, rooms, area_min, area_max,
        renovation,
        has_loggia:    has_loggia === 'true'    ? true : undefined,
        has_balcony:   has_balcony === 'true'   ? true : undefined,
        has_wardrobe:  has_wardrobe === 'true'  ? true : undefined,
        has_panoramic: has_panoramic === 'true' ? true : undefined,
        from_realtor:  from_realtor === 'true'  ? true : undefined,
        display_id:    display_id ? Number(display_id) : undefined,
        complex_id,
        page, limit,
      },
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

  @Get(':id/events')
  getEvents(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    void actor;
    return this.propertiesService.getEvents(id);
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
