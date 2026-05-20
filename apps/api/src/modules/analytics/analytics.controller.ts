import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() actor: JwtPayload) {
    return this.analyticsService.getDashboardStats(actor);
  }

  @Get('reports')
  getReports(
    @CurrentUser() actor: JwtPayload,
    @Query('period') period = 'month',
    @Query('from') from_date?: string,
    @Query('to') to_date?: string,
  ) {
    return this.analyticsService.getReportStats(actor, period, from_date, to_date);
  }
}
