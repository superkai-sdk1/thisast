import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, EventPattern, ClientProxy, Payload } from '@nestjs/microservices';
import {
  MSG_OWNERS_LIST,
  MSG_OWNERS_FIND_ONE,
  MSG_OWNERS_CREATE,
  MSG_OWNERS_UPDATE,
  MSG_OWNERS_DELETE,
  EVT_AUDIT_LOG,
} from '@crm/shared-types';
import { OwnersService } from './owners.service';
import { REDIS_CLIENT } from '../app.module';

@Controller()
export class OwnersController {
  constructor(
    private readonly ownersService: OwnersService,
    @Inject(REDIS_CLIENT) private readonly client: ClientProxy,
  ) {}

  @MessagePattern(MSG_OWNERS_LIST)
  async list(@Payload() data: { actor: { sub: string; role: string } }) {
    return this.ownersService.findAll(data.actor);
  }

  @MessagePattern(MSG_OWNERS_FIND_ONE)
  async findOne(
    @Payload() data: { id: string; actor: { sub: string; role: string }; ip?: string; userAgent?: string },
  ) {
    const owner = await this.ownersService.findOne(data.id);

    // Emit audit log for every contact view
    this.client.emit(EVT_AUDIT_LOG, {
      actor_id: data.actor.sub,
      action_type: 'VIEW_CONTACT',
      target_type: 'owner',
      target_id: data.id,
      ip_address: data.ip,
      user_agent: data.userAgent,
    });

    return owner;
  }

  @MessagePattern(MSG_OWNERS_CREATE)
  async create(@Payload() data: { dto: any; actor: { sub: string; role: string } }) {
    return this.ownersService.create(data.dto, data.actor);
  }

  @MessagePattern(MSG_OWNERS_UPDATE)
  async update(@Payload() data: { id: string; dto: any }) {
    return this.ownersService.update(data.id, data.dto);
  }

  @MessagePattern(MSG_OWNERS_DELETE)
  async delete(@Payload() data: { id: string }) {
    return this.ownersService.delete(data.id);
  }
}
