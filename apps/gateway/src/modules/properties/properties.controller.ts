import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Inject, Res,
  UseInterceptors, UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../app.module.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('properties')
export class PropertiesController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  list(@Query() filter: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_PROPS_LIST, { filter, user }));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_PROPS_FIND_ONE, { id, user }));
  }

  @Post()
  create(@Body() dto: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_PROPS_CREATE, { dto, user }));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_PROPS_UPDATE, { id, dto, user }));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_PROPS_DELETE, { id, user }));
  }

  @Patch(':id/visibility')
  updateVisibility(@Param('id') id: string, @Body() body: { visibility: string }, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_PROPS_UPDATE_VISIBILITY, { id, visibility: body.visibility, user }));
  }

  @Get(':id/matches')
  getMatches(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_MATCHING_GET_PROPERTY_MATCHES, { propertyId: id }));
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Res() res: Response) {
    const pdf: Buffer = await firstValueFrom(
      this.client.send(P.MSG_PROPS_PDF, { id, user }),
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="property-${id}.pdf"`);
    res.send(Buffer.from(pdf));
  }

  @Post(':id/photos')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtPayload,
  ) {
    const uploads = (files ?? []).map((file) =>
      firstValueFrom(
        this.client.send(P.MSG_PROPS_PHOTO_UPLOAD, {
          propertyId: id,
          fileBuffer: file.buffer.toString('base64'),
          mimetype: file.mimetype,
          originalname: file.originalname,
          user,
        }),
      ),
    );
    return Promise.all(uploads);
  }

  @Delete(':id/photos/:photoId')
  deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.client.send(P.MSG_PROPS_PHOTO_DELETE, { propertyId: id, photoId, user }),
    );
  }

  @Patch(':id/photos/reorder')
  reorderPhotos(
    @Param('id') id: string,
    @Body() body: { order: { id: string; display_order: number }[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.client.send(P.MSG_PROPS_PHOTO_REORDER, { propertyId: id, order: body.order, user }),
    );
  }
}
