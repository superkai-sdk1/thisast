import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisClientModule } from './redis-client.module';
import { AuthModule }         from './modules/auth/auth.module';
import { UsersModule }        from './modules/users/users.module';
import { PropertiesModule }   from './modules/properties/properties.module';
import { OwnersModule }       from './modules/owners/owners.module';
import { DemandsModule }      from './modules/demands/demands.module';
import { DealsModule }        from './modules/deals/deals.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule }        from './modules/admin/admin.module';
import { ComplexesModule }    from './modules/complexes/complexes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
    }),
    RedisClientModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    OwnersModule,
    DemandsModule,
    DealsModule,
    NotificationsModule,
    AdminModule,
    ComplexesModule,
  ],
})
export class AppModule {}
