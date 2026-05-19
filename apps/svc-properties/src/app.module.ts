import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from '@crm/shared-core';
import { PropertiesModule } from './properties/properties.module';
import { OwnersModule } from './owners/owners.module';
import { StorageModule } from './storage/storage.module';
import { SearchModule } from './search/search.module';
import { PdfModule } from './pdf/pdf.module';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.register([
      {
        name: REDIS_CLIENT,
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
      },
    ]),
    DatabaseModule,
    PropertiesModule,
    OwnersModule,
    StorageModule,
    SearchModule,
    PdfModule,
  ],
})
export class AppModule {}
