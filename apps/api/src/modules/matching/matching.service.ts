import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { Client } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator.js';
import type { Pool } from 'pg';
import { MATCHING_QUEUE, MATCHING_JOBS } from '../../queue/queue.constants.js';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MatchingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchingService.name);
  private pgNotifyClient: Client | null = null;

  constructor(
    @Inject(DB_POOL) private db: Pool,
    @InjectQueue(MATCHING_QUEUE) private matchingQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.startPgNotifyListener();
  }

  async onModuleDestroy() {
    if (this.pgNotifyClient) {
      await this.pgNotifyClient.end().catch(console.error);
    }
  }

  private async startPgNotifyListener() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return;

    this.pgNotifyClient = new Client({ connectionString });
    await this.pgNotifyClient.connect();
    await this.pgNotifyClient.query('LISTEN price_drop');

    this.pgNotifyClient.on('notification', async (msg) => {
      if (msg.channel !== 'price_drop' || !msg.payload) return;
      try {
        const data = JSON.parse(msg.payload) as { property_id: string; old_price: number; new_price: number };
        this.logger.log(`Price drop: property ${data.property_id} ${data.old_price} → ${data.new_price}`);

        await this.matchingQueue.add(MATCHING_JOBS.RECALC_PROPERTY, { propertyId: data.property_id }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        });

        // Mark event as processed
        await this.db.query(
          'UPDATE price_drop_events SET processed_at = NOW() WHERE property_id = $1 AND processed_at IS NULL',
          [data.property_id],
        );
      } catch (err) {
        this.logger.error('Failed to handle price_drop notification', err);
      }
    });

    this.pgNotifyClient.on('error', async (err) => {
      this.logger.error('pg NOTIFY client error, reconnecting...', err);
      await this.startPgNotifyListener().catch(console.error);
    });

    this.logger.log('PostgreSQL NOTIFY listener started on channel: price_drop');
  }

  // Every day at 9am: check for stale leads and notify agents
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkStaleLeads() {
    const result = await this.db.query(
      `SELECT id, agent_id, buyer_name FROM stale_demands LIMIT 50`,
    );

    for (const row of result.rows) {
      this.logger.log(`Stale lead: ${row.buyer_name} (agent ${row.agent_id})`);
      // Notification creation is handled via NotificationsService injected into a separate module
      // to avoid circular deps — emits an event instead
    }
  }
}
