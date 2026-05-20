import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG_ANALYTICS_DASHBOARD, MSG_ANALYTICS_REPORTS } from '@crm/shared-types';
import { AnalyticsService } from './analytics.service';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @MessagePattern(MSG_ANALYTICS_DASHBOARD)
  dashboard(@Payload() data: { actorId: string; isAdmin: boolean }) {
    return this.analyticsService.getDashboardStats(data.actorId, data.isAdmin);
  }

  @MessagePattern(MSG_ANALYTICS_REPORTS)
  reports(
    @Payload()
    data: {
      actorId: string;
      isAdmin: boolean;
      period: string;
      from_date?: string;
      to_date?: string;
    },
  ) {
    return this.analyticsService.getReportStats(
      data.actorId,
      data.isAdmin,
      data.period,
      data.from_date,
      data.to_date,
    );
  }
}
