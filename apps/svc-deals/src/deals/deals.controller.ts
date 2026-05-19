import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MSG_DEALS_LIST,
  MSG_DEALS_FIND_ONE,
  MSG_DEALS_CREATE,
  MSG_DEALS_UPDATE,
  MSG_DEALS_DELETE,
  MSG_DEALS_SUMMARY,
} from '@crm/shared-types';
import type { JwtPayload } from '@crm/shared-core';
import { DealsService } from './deals.service';

@Controller()
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @MessagePattern(MSG_DEALS_LIST)
  findAll(@Payload() payload: { actor: JwtPayload }) {
    return this.dealsService.findAll(payload.actor);
  }

  @MessagePattern(MSG_DEALS_FIND_ONE)
  findOne(@Payload() payload: { id: string; actor: JwtPayload }) {
    return this.dealsService.findOne(payload.id, payload.actor);
  }

  @MessagePattern(MSG_DEALS_CREATE)
  create(
    @Payload()
    payload: {
      dto: {
        demand_id?: string;
        property_id?: string;
        is_external_property?: boolean;
        external_address?: string;
        buyer_owner_id?: string;
        seller_owner_id?: string;
        deal_price: number;
        my_commission?: number;
        payment_form?: string;
        notes?: string;
      };
      actor: JwtPayload;
    },
  ) {
    return this.dealsService.create(payload.dto, payload.actor);
  }

  @MessagePattern(MSG_DEALS_UPDATE)
  update(
    @Payload()
    payload: {
      id: string;
      dto: Record<string, unknown>;
      actor: JwtPayload;
    },
  ) {
    return this.dealsService.update(payload.id, payload.dto, payload.actor);
  }

  @MessagePattern(MSG_DEALS_DELETE)
  delete(@Payload() payload: { id: string; actor: JwtPayload }) {
    return this.dealsService.delete(payload.id, payload.actor);
  }

  @MessagePattern(MSG_DEALS_SUMMARY)
  getSummary(@Payload() payload: { actor: JwtPayload }) {
    return this.dealsService.getSummary(payload.actor);
  }
}
