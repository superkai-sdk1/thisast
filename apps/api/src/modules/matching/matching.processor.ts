import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator';
import { MATCHING_QUEUE, MATCHING_JOBS } from '../../queue/queue.constants';
import { NotificationsService } from '../notifications/notifications.service';

@Processor(MATCHING_QUEUE)
export class MatchingProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchingProcessor.name);

  constructor(
    @Inject(DB_POOL) private db: Pool,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === MATCHING_JOBS.RECALC_DEMAND) {
      await this.recalcForDemand(job.data.demandId as string);
    } else if (job.name === MATCHING_JOBS.RECALC_PROPERTY) {
      await this.recalcForProperty(job.data.propertyId as string);
    }
  }

  private async recalcForDemand(demandId: string) {
    this.logger.log(`Recalculating matches for demand ${demandId}`);

    const { rows } = await this.db.query<{ recalculate_matches_for_demand: number }>(
      'SELECT recalculate_matches_for_demand($1)',
      [demandId],
    );
    const count = rows[0]?.recalculate_matches_for_demand ?? 0;
    this.logger.log(`Scored ${count} properties for demand ${demandId}`);

    await this.notifyNewMatches(demandId);
  }

  private async recalcForProperty(propertyId: string) {
    this.logger.log(`Recalculating matches for property ${propertyId}`);

    const { rows } = await this.db.query<{ recalculate_matches_for_property: number }>(
      'SELECT recalculate_matches_for_property($1)',
      [propertyId],
    );
    const count = rows[0]?.recalculate_matches_for_property ?? 0;
    this.logger.log(`Scored ${count} demands for property ${propertyId}`);

    // Find all affected demands and notify their agents
    const affectedDemands = await this.db.query<{ demand_id: string }>(
      `SELECT DISTINCT demand_id FROM demand_property_matches
       WHERE property_id = $1 AND score >= 0.65 AND notified_at IS NULL`,
      [propertyId],
    );

    for (const row of affectedDemands.rows) {
      await this.notifyNewMatches(row.demand_id);
    }
  }

  private async notifyNewMatches(demandId: string) {
    // Fetch new high-score matches not yet notified
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

      await this.notificationsService.create({
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

      // Mark as notified
      await this.db.query(
        'UPDATE demand_property_matches SET notified_at = NOW() WHERE demand_id = $1 AND property_id = $2',
        [demandId, match.property_id],
      );
    }
  }
}
