import { Injectable } from '@nestjs/common';
import { InjectDb } from '@crm/shared-core';
import type { Pool } from 'pg';

function resolvePeriod(
  period: string,
  from_date?: string,
  to_date?: string,
): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dateTo = to_date ?? now.toISOString();

  switch (period) {
    case 'day': {
      const midnight = new Date(now);
      midnight.setHours(0, 0, 0, 0);
      return { dateFrom: from_date ?? midnight.toISOString(), dateTo };
    }
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { dateFrom: from_date ?? weekAgo.toISOString(), dateTo };
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: from_date ?? startOfMonth.toISOString(), dateTo };
    }
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      return { dateFrom: from_date ?? startOfQuarter.toISOString(), dateTo };
    }
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { dateFrom: from_date ?? startOfYear.toISOString(), dateTo };
    }
    default:
      return { dateFrom: from_date ?? '2000-01-01T00:00:00.000Z', dateTo };
  }
}

@Injectable()
export class AnalyticsService {
  constructor(@InjectDb() private db: Pool) {}

  async getDashboardStats(actorId: string, isAdmin: boolean) {
    const agentFilter = isAdmin ? '' : `AND agent_id = '${actorId}'`;

    const [taskStats, leadStats, dealStats] = await Promise.all([
      this.db.query(`
        SELECT
          COUNT(*) FILTER (WHERE TRUE ${agentFilter})::int AS task_total,
          COUNT(*) FILTER (WHERE status = 'done' ${agentFilter})::int AS task_done
        FROM tasks
      `),
      this.db.query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()) ${agentFilter})::int AS new_leads_month,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' ${agentFilter})::int AS new_leads_week
        FROM demands
      `),
      this.db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status NOT IN ('closed_won','closed_lost') ${agentFilter})::int AS active_deals,
          COUNT(*) FILTER (WHERE status = 'closed_won' ${agentFilter})::int AS closed_deals,
          COALESCE(SUM(commission_amount) FILTER (WHERE status = 'closed_won' ${agentFilter}), 0) AS earned_commissions
        FROM deals
      `),
    ]);

    const t = taskStats.rows[0] as Record<string, unknown>;
    const l = leadStats.rows[0] as Record<string, unknown>;
    const d = dealStats.rows[0] as Record<string, unknown>;

    const taskTotal = (t['task_total'] as number) ?? 0;
    const taskDone = (t['task_done'] as number) ?? 0;
    const taskCompletionPct = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;

    return {
      task_completion_pct: taskCompletionPct,
      task_total: taskTotal,
      task_done: taskDone,
      new_leads_month: l['new_leads_month'] ?? 0,
      new_leads_week: l['new_leads_week'] ?? 0,
      active_deals: d['active_deals'] ?? 0,
      closed_deals: d['closed_deals'] ?? 0,
      earned_commissions: d['earned_commissions'] ?? 0,
    };
  }

  async getReportStats(
    actorId: string,
    isAdmin: boolean,
    period: string,
    from_date?: string,
    to_date?: string,
  ) {
    const { dateFrom, dateTo } = resolvePeriod(period, from_date, to_date);
    const agentFilter = isAdmin ? '' : `AND agent_id = '${actorId}'`;

    const [contactsResult, clientsResult, propertiesResult, dealsResult, activityResult] =
      await Promise.all([
        this.db.query(`
          SELECT COUNT(*)::int AS count
          FROM demands
          WHERE created_at BETWEEN $1 AND $2
            ${agentFilter}
        `, [dateFrom, dateTo]),

        this.db.query(`
          SELECT COUNT(*)::int AS count
          FROM demands
          WHERE kanban_status IN ('client', 'closed')
            AND updated_at BETWEEN $1 AND $2
            ${agentFilter}
        `, [dateFrom, dateTo]),

        this.db.query(`
          SELECT COUNT(*)::int AS count
          FROM properties
          WHERE created_at BETWEEN $1 AND $2
            AND deleted_at IS NULL
            ${agentFilter}
        `, [dateFrom, dateTo]),

        this.db.query(`
          SELECT COUNT(*)::int AS count
          FROM deals
          WHERE created_at BETWEEN $1 AND $2
            ${agentFilter}
        `, [dateFrom, dateTo]),

        this.db.query(`
          SELECT ee.*, u.full_name AS actor_name
          FROM entity_events ee
          LEFT JOIN users u ON u.id = ee.actor_id
          WHERE ee.created_at BETWEEN $1 AND $2
          ORDER BY ee.created_at DESC
          LIMIT 50
        `, [dateFrom, dateTo]),
      ]);

    return {
      period,
      from_date: dateFrom,
      to_date: dateTo,
      contacts: contactsResult.rows[0]?.count ?? 0,
      clients: clientsResult.rows[0]?.count ?? 0,
      properties: propertiesResult.rows[0]?.count ?? 0,
      deals: dealsResult.rows[0]?.count ?? 0,
      activity: activityResult.rows,
    };
  }
}
