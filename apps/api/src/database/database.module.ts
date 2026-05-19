import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { DB_POOL } from '../common/decorators/inject-connection.decorator.js';

@Global()
@Module({
  providers: [
    {
      provide: DB_POOL,
      useFactory: () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });
        pool.on('error', (err) => {
          console.error('Unexpected DB pool error', err);
        });
        return pool;
      },
    },
  ],
  exports: [DB_POOL],
})
export class DatabaseModule {}
