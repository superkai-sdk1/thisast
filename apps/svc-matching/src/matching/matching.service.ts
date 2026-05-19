import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectDb } from '@crm/shared-core';
import type { Pool } from 'pg';
import { Client } from 'pg';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  EVT_PROPERTY_PRICE_DROP,
  EVT_NOTIFICATION_SEND,
} from '@crm/shared-types';
import { REDIS_CLIENT } from '../app.module';

@Injectable()
export class MatchingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchingService.name);
  private pgNotifyClient: Client | null = null;

  constructor(
    @InjectDb() private db: Pool,
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
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
    if (!connectionString) {
      this.logger.warn('DATABASE_URL not set — pg NOTIFY listener not started');
      return;
    }

    this.pgNotifyClient = new Client({ connectionString });
    await this.pgNotifyClient.connect();
    await this.pgNotifyClient.query('LISTEN price_drop');

    this.pgNotifyClient.on('notification', async (msg) => {
      if (msg.channel !== 'price_drop' || !msg.payload) return;
      try {
        const data = JSON.parse(msg.payload) as {
          property_id: string;
          old_price: number;
          new_price: number;
        };
        this.logger.log(
          `Price drop: property ${data.property_id} ${data.old_price} → ${data.new_price}`,
        );

        this.redisClient.emit(EVT_PROPERTY_PRICE_DROP, {
          propertyId: data.property_id,
          old_price: data.old_price,
          new_price: data.new_price,
        });

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

  async recalculateForDemand(demandId: string): Promise<void> {
    this.logger.log(`Recalculating matches for demand ${demandId}`);

    const { rows } = await this.db.query<{ recalculate_matches_for_demand: number }>(
      'SELECT recalculate_matches_for_demand($1)',
      [demandId],
    );
    const count = rows[0]?.recalculate_matches_for_demand ?? 0;
    this.logger.log(`Scored ${count} properties for demand ${demandId}`);

    await this.notifyNewMatches(demandId);
  }

  async recalculateForProperty(propertyId: string): Promise<void> {
    this.logger.log(`Recalculating matches for property ${propertyId}`);

    const { rows } = await this.db.query<{ recalculate_matches_for_property: number }>(
      'SELECT recalculate_matches_for_property($1)',
      [propertyId],
    );
    const count = rows[0]?.recalculate_matches_for_property ?? 0;
    this.logger.log(`Scored ${count} demands for property ${propertyId}`);

    const affectedDemands = await this.db.query<{ demand_id: string }>(
      `SELECT DISTINCT demand_id FROM demand_property_matches
       WHERE property_id = $1 AND score >= 0.65 AND notified_at IS NULL`,
      [propertyId],
    );

    for (const row of affectedDemands.rows) {
      await this.notifyNewMatches(row.demand_id);
    }
  }

  private async notifyNewMatches(demandId: string): Promise<void> {
    const matches = await this.db.query(
      `SELECT dpm.*, d.agent_id, d.buyer_name,
              p.city, p.district, p.price, p.rooms
       FROM demand_property_matches dpm
       JOIN demands d ON d.id = dpm.demand_id
       JOIN properties p ON p.id = dpm.property_id
       WHERE dpm.demand_id = $1
         AND dpm.score >= 0.65
         AND dpm.notified_at IS NULL
         AND NOT dpm.is_dismissed
       ORDER BY dpm.score DESC
       LIMIT 5`,
      [demandId],
    );

    for (const match of matches.rows) {
      const score = Math.round(Number(match.score) * 100);
      const title = `Новое совпадение ${score}% — ${match.buyer_name}`;
      const body = `${match.city}, ${match.district ?? ''} · ${match.rooms ?? '?'} комн. · ${Number(match.price).toLocaleString('ru')} ₽`;

      this.redisClient.emit(EVT_NOTIFICATION_SEND, {
        user_id: match.agent_id as string,
        title,
        body,
        type: 'new_match',
        payload: {
          demand_id: demandId,
          property_id: match.property_id as string,
          score,
        },
      });

      await this.db.query(
        'UPDATE demand_property_matches SET notified_at = NOW() WHERE demand_id = $1 AND property_id = $2',
        [demandId, match.property_id],
      );
    }
  }

  async getDemandMatches(demandId: string, limit = 20) {
    const result = await this.db.query(
      `SELECT dpm.*, p.city, p.district, p.price, p.rooms, p.area_sqm, p.property_type,
              json_agg(pp ORDER BY pp.display_order) FILTER (WHERE pp.id IS NOT NULL) AS photos
       FROM demand_property_matches dpm
       JOIN properties p ON p.id = dpm.property_id
       LEFT JOIN property_photos pp ON pp.property_id = p.id
       WHERE dpm.demand_id = $1 AND NOT dpm.is_dismissed AND p.deleted_at IS NULL
       GROUP BY dpm.demand_id, dpm.property_id, dpm.score, dpm.match_details,
                dpm.is_dismissed, dpm.notified_at, dpm.dismissed_at, dpm.created_at,
                p.city, p.district, p.price, p.rooms, p.area_sqm, p.property_type
       ORDER BY dpm.score DESC
       LIMIT $2`,
      [demandId, limit],
    );
    return result.rows;
  }

  async getPropertyMatches(propertyId: string, limit = 20) {
    const result = await this.db.query(
      `SELECT dpm.*, d.buyer_name, d.buyer_phone, d.budget_max, d.kanban_status
       FROM demand_property_matches dpm
       JOIN demands d ON d.id = dpm.demand_id
       WHERE dpm.property_id = $1 AND NOT dpm.is_dismissed
       ORDER BY dpm.score DESC
       LIMIT $2`,
      [propertyId, limit],
    );
    return result.rows;
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkStaleLeads() {
    this.logger.log('Checking stale leads...');
    const result = await this.db.query(
      `SELECT id, agent_id, buyer_name FROM stale_demands LIMIT 50`,
    );

    for (const row of result.rows) {
      this.logger.log(`Stale lead: ${row.buyer_name as string} (agent ${row.agent_id as string})`);
      this.redisClient.emit(EVT_NOTIFICATION_SEND, {
        user_id: row.agent_id as string,
        title: `Неактивная заявка — ${row.buyer_name as string}`,
        body: 'Заявка не обновлялась более 30 дней. Проверьте её статус.',
        type: 'stale_demand',
        payload: { demand_id: row.id as string },
      });
    }
  }
}
