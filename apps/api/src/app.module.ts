import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PropertiesModule } from './modules/properties/properties.module.js';
import { OwnersModule } from './modules/owners/owners.module.js';
import { DemandsModule } from './modules/demands/demands.module.js';
import { DealsModule } from './modules/deals/deals.module.js';
import { MatchingModule } from './modules/matching/matching.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AuditLogModule } from './modules/audit-log/audit-log.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { PdfModule } from './modules/pdf/pdf.module.js';

@Module({
  imports: [
    // Queue infrastructure (shared)
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      },
    }),

    // Core
    DatabaseModule,
    StorageModule,
    SearchModule,
    AuditLogModule,
    PdfModule,

    // Feature modules
    AuthModule,
    UsersModule,
    PropertiesModule,
    OwnersModule,
    DemandsModule,
    DealsModule,
    MatchingModule,
    NotificationsModule,
  ],
})
export class AppModule {}
