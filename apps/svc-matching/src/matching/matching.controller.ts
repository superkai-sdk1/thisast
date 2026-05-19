import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import {
  EVT_DEMAND_CREATED,
  EVT_DEMAND_UPDATED,
  EVT_PROPERTY_CREATED,
  EVT_PROPERTY_PRICE_DROP,
  MSG_MATCHING_GET_DEMAND_MATCHES,
  MSG_MATCHING_GET_PROPERTY_MATCHES,
} from '@crm/shared-types';
import { MatchingService } from './matching.service.js';

@Controller()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @EventPattern(EVT_DEMAND_CREATED)
  async onDemandCreated(@Payload() data: { demandId: string }) {
    await this.matchingService.recalculateForDemand(data.demandId);
  }

  @EventPattern(EVT_DEMAND_UPDATED)
  async onDemandUpdated(@Payload() data: { demandId: string }) {
    await this.matchingService.recalculateForDemand(data.demandId);
  }

  @EventPattern(EVT_PROPERTY_CREATED)
  async onPropertyCreated(@Payload() data: { propertyId: string }) {
    await this.matchingService.recalculateForProperty(data.propertyId);
  }

  @EventPattern(EVT_PROPERTY_PRICE_DROP)
  async onPropertyPriceDrop(@Payload() data: { propertyId: string }) {
    await this.matchingService.recalculateForProperty(data.propertyId);
  }

  @MessagePattern(MSG_MATCHING_GET_DEMAND_MATCHES)
  async getDemandMatches(@Payload() data: { demandId: string; limit?: number }) {
    return this.matchingService.getDemandMatches(data.demandId, data.limit);
  }

  @MessagePattern(MSG_MATCHING_GET_PROPERTY_MATCHES)
  async getPropertyMatches(@Payload() data: { propertyId: string; limit?: number }) {
    return this.matchingService.getPropertyMatches(data.propertyId, data.limit);
  }
}
