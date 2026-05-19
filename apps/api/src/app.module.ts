import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { OwnersModule } from './modules/owners/owners.module';
import { DemandsModule } from './modules/demands/demands.module';
import { DealsModule } from './modules/deals/deals.module';
import { MatchingModule } from './modules/matching/matching.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { StorageModule } from './modules/storage/storage.module';
import { SearchModule } from './modules/search/search.module';
import { PdfModule } from './modules/pdf/pdf.module';

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
