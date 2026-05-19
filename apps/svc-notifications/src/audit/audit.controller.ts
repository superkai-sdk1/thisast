import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { MSG_AUDIT_LIST, EVT_AUDIT_LOG } from '@crm/shared-types';
import { AuditService } from './audit.service';

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @MessagePattern(MSG_AUDIT_LIST)
  async list(@Payload() data: { page?: number; limit?: number }) {
    return this.auditService.findAll(data.page, data.limit);
  }

  @EventPattern(EVT_AUDIT_LOG)
  async onAuditLog(
    @Payload() data: {
      actor_id: string | null;
      action_type: string;
      target_type: string;
      target_id?: string;
      metadata?: Record<string, unknown>;
      ip_address?: string;
      user_agent?: string;
    },
  ) {
    // INSERT only — audit log is immutable
    await this.auditService.log(data);
  }
}
