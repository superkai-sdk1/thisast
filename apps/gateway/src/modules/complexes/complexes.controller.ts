import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Inject,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../redis-client.module';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('complexes')
@ApiBearerAuth()
@Controller('complexes')
export class ComplexesController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  list(@Query() filter: Record<string, unknown>) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_LIST, { filter }));
  }

  @Get('trash')
  listTrash() {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_TRASH_LIST, {}));
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_RESTORE, { id }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_FIND_ONE, { id }));
  }

  @Post()
  create(@Body() dto: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_CREATE, { dto, actor: user }));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_UPDATE, { id, dto }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_DELETE, { id }));
  }

  @Post(':id/photos')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') complexId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('is_cover') isCover: string,
  ) {
    return firstValueFrom(
      this.client.send(P.MSG_COMPLEXES_PHOTO_UPLOAD, {
        complexId,
        buffer: Array.from(file.buffer),
        originalname: file.originalname,
        mimetype: file.mimetype,
        isCover: isCover === 'true',
      }),
    );
  }

  @Delete('photos/:photoId')
  deletePhoto(@Param('photoId') photoId: string) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_PHOTO_DELETE, { photoId }));
  }

  @Get(':id/apartments')
  getApartments(@Param('id') complexId: string) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_APARTMENT_LIST, { complexId }));
  }

  @Post(':id/apartments')
  createApartment(@Param('id') complexId: string, @Body() dto: Record<string, unknown>) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_APARTMENT_CREATE, { complexId, dto }));
  }

  @Patch('apartments/:apartmentId')
  updateApartment(@Param('apartmentId') id: string, @Body() dto: Record<string, unknown>) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_APARTMENT_UPDATE, { id, dto }));
  }

  @Delete('apartments/:apartmentId')
  deleteApartment(@Param('apartmentId') id: string) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_APARTMENT_DELETE, { id }));
  }

  @Get(':id/documents')
  getDocuments(@Param('id') complexId: string) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_DOCUMENT_LIST, { complexId }));
  }

  @Post(':id/documents')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') complexId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
  ) {
    return firstValueFrom(
      this.client.send(P.MSG_COMPLEXES_DOCUMENT_UPLOAD, {
        complexId,
        buffer: Array.from(file.buffer),
        originalname: file.originalname,
        mimetype: file.mimetype,
        name: name ?? file.originalname,
      }),
    );
  }

  @Delete('documents/:documentId')
  deleteDocument(@Param('documentId') id: string) {
    return firstValueFrom(this.client.send(P.MSG_COMPLEXES_DOCUMENT_DELETE, { id }));
  }
}
