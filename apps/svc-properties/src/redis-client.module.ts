import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [
    ClientsModule.register([{
      name: REDIS_CLIENT,
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST ?? 'redis',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }]),
  ],
  exports: [ClientsModule],
})
export class RedisClientModule {}
