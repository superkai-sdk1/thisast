import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto, UpdatePermissionsDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../common/types/jwt-payload.type.js';
import { StorageService } from '../storage/storage.service.js';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private storageService: StorageService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.usersService.findAll(user.role === Role.SUPERADMIN ? undefined : user.agency_id ?? undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/permissions')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  updatePermissions(@Param('id') id: string, @Body() dto: UpdatePermissionsDto) {
    return this.usersService.updatePermissions(id, dto);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const url = await this.storageService.upload(file, 'crm-avatars');
    return this.usersService.updateAvatar(id, url);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN)
  delete(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
