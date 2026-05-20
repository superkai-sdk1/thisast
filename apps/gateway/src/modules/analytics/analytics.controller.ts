import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../redis-client.module';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: JwtPayload) {
    const isAdmin = ['admin', 'superadmin'].includes(user.role);
    return firstValueFrom(this.client.send(P.MSG_ANALYTICS_DASHBOARD, { actorId: user.sub, isAdmin }));
  }

  @Get('reports')
  reports(
    @CurrentUser() user: JwtPayload,
    @Query('period') period = 'month',
    @Query('from') from_date?: string,
    @Query('to') to_date?: string,
  ) {
    const isAdmin = ['admin', 'superadmin'].includes(user.role);
    return firstValueFrom(
      this.client.send(P.MSG_ANALYTICS_REPORTS, { actorId: user.sub, isAdmin, period, from_date, to_date }),
    );
  }
}
