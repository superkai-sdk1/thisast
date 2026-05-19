import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule }         from './modules/auth/auth.module.js';
import { UsersModule }        from './modules/users/users.module.js';
import { PropertiesModule }   from './modules/properties/properties.module.js';
import { OwnersModule }       from './modules/owners/owners.module.js';
import { DemandsModule }      from './modules/demands/demands.module.js';
import { DealsModule }        from './modules/deals/deals.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AdminModule }        from './modules/admin/admin.module.js';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisClientConfig = {
  transport: Transport.REDIS as const,
  options: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
    }),
    ClientsModule.register([{ name: REDIS_CLIENT, ...redisClientConfig }]),
    AuthModule,
    UsersModule,
    PropertiesModule,
    OwnersModule,
    DemandsModule,
    DealsModule,
    NotificationsModule,
    AdminModule,
  ],
})
export class AppModule {}
