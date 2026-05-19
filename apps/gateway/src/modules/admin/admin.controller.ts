import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT } from '../../redis-client.module';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@crm/shared-core';
import * as P from '@crm/shared-types';

@ApiTags('audit-log')
@ApiBearerAuth()
@Controller('audit-log')
export class AdminController {
  constructor(@Inject(REDIS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    if (user.role !== 'superadmin') throw new Error('Forbidden');
    return firstValueFrom(
      this.client.send(P.MSG_AUDIT_LIST, { page: Number(page), limit: Number(limit) }),
    );
  }
}
