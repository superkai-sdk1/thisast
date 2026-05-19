import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@crm/shared-core';
import { RedisClientModule } from './redis-client.module';
import { PropertiesModule } from './properties/properties.module';
import { OwnersModule } from './owners/owners.module';
import { StorageModule } from './storage/storage.module';
import { SearchModule } from './search/search.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisClientModule,
    DatabaseModule,
    PropertiesModule,
    OwnersModule,
    StorageModule,
    SearchModule,
    PdfModule,
  ],
})
export class AppModule {}
