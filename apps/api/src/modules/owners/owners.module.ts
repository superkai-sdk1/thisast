import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller.js';
import { OwnersService } from './owners.service.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  controllers: [OwnersController],
  providers: [OwnersService],
  exports: [OwnersService],
})
export class OwnersModule {}
