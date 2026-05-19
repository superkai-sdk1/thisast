import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MSG_USERS_LIST,
  MSG_USERS_FIND_ONE,
  MSG_USERS_CREATE,
  MSG_USERS_UPDATE,
  MSG_USERS_UPDATE_PERMISSIONS,
  MSG_USERS_UPLOAD_AVATAR,
} from '@crm/shared-types';
import type { JwtPayload } from '@crm/shared-core';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(MSG_USERS_LIST)
  findAll(@Payload() payload: { agencyId?: string }) {
    return this.usersService.findAll(payload.agencyId);
  }

  @MessagePattern(MSG_USERS_FIND_ONE)
  findOne(@Payload() payload: { id: string }) {
    return this.usersService.findOne(payload.id);
  }

  @MessagePattern(MSG_USERS_CREATE)
  create(
    @Payload()
    payload: {
      dto: {
        email: string;
        password: string;
        full_name: string;
        role?: string;
        phone?: string;
        agency_id?: string;
        permission_flags?: Record<string, boolean>;
      };
      actor: JwtPayload;
    },
  ) {
    return this.usersService.create(payload.dto, payload.actor);
  }

  @MessagePattern(MSG_USERS_UPDATE)
  update(
    @Payload()
    payload: {
      id: string;
      dto: { full_name?: string; phone?: string; is_active?: boolean };
    },
  ) {
    return this.usersService.update(payload.id, payload.dto);
  }

  @MessagePattern(MSG_USERS_UPDATE_PERMISSIONS)
  updatePermissions(
    @Payload()
    payload: {
      id: string;
      dto: { permission_flags: Record<string, boolean> };
    },
  ) {
    return this.usersService.updatePermissions(payload.id, payload.dto);
  }

  @MessagePattern(MSG_USERS_UPLOAD_AVATAR)
  uploadAvatar(@Payload() payload: { id: string; photoUrl: string }) {
    return this.usersService.updateAvatar(payload.id, payload.photoUrl);
  }
}
