import { Controller, Get, Patch, Post, Param, Body, Inject, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../app.module.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.client.send(P.MSG_USERS_LIST, { agencyId: user.agencyId }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send(P.MSG_USERS_FIND_ONE, { id }));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return firstValueFrom(this.client.send(P.MSG_USERS_UPDATE, { id, dto }));
  }

  @Patch(':id/permissions')
  updatePermissions(@Param('id') id: string, @Body() flags: Record<string, boolean>) {
    return firstValueFrom(this.client.send(P.MSG_USERS_UPDATE_PERMISSIONS, { id, flags }));
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return firstValueFrom(
      this.client.send(P.MSG_USERS_UPLOAD_AVATAR, {
        id,
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      }),
    );
  }
}
