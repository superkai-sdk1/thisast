import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MSG_DEMANDS_LIST,
  MSG_DEMANDS_FIND_ONE,
  MSG_DEMANDS_CREATE,
  MSG_DEMANDS_UPDATE,
  MSG_DEMANDS_DELETE,
  MSG_DEMANDS_UPDATE_STATUS,
  MSG_DEMANDS_GET_MATCHES,
  MSG_DEMANDS_GET_ACTIVITY,
  MSG_DEMANDS_ADD_ACTIVITY,
} from '@crm/shared-types';
import type { JwtPayload } from '@crm/shared-core';
import { DemandsService } from './demands.service';

@Controller()
export class DemandsController {
  constructor(private readonly demandsService: DemandsService) {}

  @MessagePattern(MSG_DEMANDS_LIST)
  findAll(@Payload() payload: { actor: JwtPayload; status?: string }) {
    return this.demandsService.findAll(payload.actor, payload.status);
  }

  @MessagePattern(MSG_DEMANDS_FIND_ONE)
  findOne(@Payload() payload: { id: string; actor: JwtPayload }) {
    return this.demandsService.findOne(payload.id, payload.actor);
  }

  @MessagePattern(MSG_DEMANDS_CREATE)
  create(@Payload() payload: { dto: Record<string, unknown>; actor: JwtPayload }) {
    return this.demandsService.create(payload.dto, payload.actor);
  }

  @MessagePattern(MSG_DEMANDS_UPDATE)
  update(
    @Payload() payload: { id: string; dto: Record<string, unknown>; actor: JwtPayload },
  ) {
    return this.demandsService.update(payload.id, payload.dto, payload.actor);
  }

  @MessagePattern(MSG_DEMANDS_DELETE)
  delete(@Payload() payload: { id: string; actor: JwtPayload }) {
    return this.demandsService.delete(payload.id, payload.actor);
  }

  @MessagePattern(MSG_DEMANDS_UPDATE_STATUS)
  updateStatus(@Payload() payload: { id: string; status: string; actor: JwtPayload }) {
    return this.demandsService.updateKanbanStatus(payload.id, payload.status, payload.actor);
  }

  @MessagePattern(MSG_DEMANDS_GET_MATCHES)
  getMatches(@Payload() payload: { demandId: string; limit?: number }) {
    return this.demandsService.getMatches(payload.demandId, payload.limit);
  }

  @MessagePattern(MSG_DEMANDS_GET_ACTIVITY)
  getActivity(@Payload() payload: { demandId: string }) {
    return this.demandsService.getActivity(payload.demandId);
  }

  @MessagePattern(MSG_DEMANDS_ADD_ACTIVITY)
  addActivity(
    @Payload() payload: { demandId: string; type: string; body: string; actor: JwtPayload },
  ) {
    return this.demandsService.addActivity(
      payload.demandId,
      payload.type,
      payload.body,
      payload.actor,
    );
  }
}
