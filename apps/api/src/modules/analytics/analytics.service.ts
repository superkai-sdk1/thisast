import { Injectable, Inject } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DB_POOL) private db: Pool) {}

  async getDashboardStats(actor: JwtPayload) {
    const isAdmin = [Role.ADMIN, Role.SUPERADMIN].includes(actor.role as Role);
    const agentFilter = isAdmin ? '' : `AND agent_id = '${actor.sub}'`;
    const propAgentFilter = isAdmin ? '' : `AND owner_agent_id = '${actor.sub}'`;

    const [tasks, leads, deals, commissions] = await Promise.all([
      this.db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status != 'cancelled') AS total,
          COUNT(*) FILTER (WHERE status = 'done') AS done
        FROM tasks
        WHERE created_at >= date_trunc('month', NOW()) ${agentFilter}
      `),
      this.db.query(`
        SELECT
          COUNT(*) AS total_month,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS total_week
        FROM demands
        WHERE created_at >= date_trunc('month', NOW()) ${agentFilter}
      `),
      this.db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') AS active,
          COUNT(*) FILTER (WHERE status = 'closed') AS closed
        FROM deals
        WHERE created_at >= date_trunc('year', NOW()) ${agentFilter}
      `),
      this.db.query(`
        SELECT COALESCE(SUM(commission_amount), 0) AS total
        FROM deals
        WHERE status = 'closed'
          AND closed_at >= date_trunc('month', NOW())
          ${agentFilter}
      `),
    ]);

    const taskTotal = Number(tasks.rows[0]?.total ?? 0);
    const taskDone = Number(tasks.rows[0]?.done ?? 0);

    return {
      task_completion_pct: taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0,
      task_total: taskTotal,
      task_done: taskDone,
      new_leads_month: Number(leads.rows[0]?.total_month ?? 0),
      new_leads_week: Number(leads.rows[0]?.total_week ?? 0),
      active_deals: Number(deals.rows[0]?.active ?? 0),
      closed_deals: Number(deals.rows[0]?.closed ?? 0),
      earned_commissions: Number(commissions.rows[0]?.total ?? 0),
    };
  }

  async getReportStats(actor: JwtPayload, period: string, from_date?: string, to_date?: string) {
    const isAdmin = [Role.ADMIN, Role.SUPERADMIN].includes(actor.role as Role);
    const agentFilter = isAdmin ? '' : `AND agent_id = '${actor.sub}'`;
    const propAgentFilter = isAdmin ? '' : `AND owner_agent_id = '${actor.sub}'`;

    const { dateFrom, dateTo } = this.resolvePeriod(period, from_date, to_date);

    const [contacts, clients, properties, dealsStats, activity] = await Promise.all([
      this.db.query(`
        SELECT COUNT(*) AS total
        FROM activity_logs
        WHERE created_at BETWEEN $1 AND $2 ${agentFilter}
      `, [dateFrom, dateTo]),
      this.db.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE client_type = 'buyer') AS buyers,
          COUNT(*) FILTER (WHERE client_type = 'seller') AS sellers,
          COUNT(*) FILTER (WHERE client_type = 'renter') AS renters,
          COUNT(*) FILTER (WHERE client_type = 'landlord') AS landlords
        FROM demands
        WHERE created_at BETWEEN $1 AND $2 ${agentFilter}
      `, [dateFrom, dateTo]),
      this.db.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE property_type = 'apartment') AS apartments,
          COUNT(*) FILTER (WHERE property_type = 'house') AS houses,
          COUNT(*) FILTER (WHERE property_type = 'land') AS lands,
          COUNT(*) FILTER (WHERE listing_type = 'sale') AS for_sale,
          COUNT(*) FILTER (WHERE listing_type = 'rent') AS for_rent
        FROM properties
        WHERE created_at BETWEEN $1 AND $2 AND deleted_at IS NULL ${propAgentFilter}
      `, [dateFrom, dateTo]),
      this.db.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'closed') AS closed,
          COALESCE(SUM(commission_amount) FILTER (WHERE status = 'closed'), 0) AS commissions
        FROM deals
        WHERE created_at BETWEEN $1 AND $2 ${agentFilter}
      `, [dateFrom, dateTo]),
      this.db.query(`
        SELECT ee.event_type, ee.description, ee.created_at, u.full_name AS user_name
        FROM entity_events ee
        LEFT JOIN users u ON u.id = ee.user_id
        WHERE ee.created_at BETWEEN $1 AND $2
        ORDER BY ee.created_at DESC
        LIMIT 50
      `, [dateFrom, dateTo]),
    ]);

    return {
      period: { from: dateFrom, to: dateTo },
      contacts: contacts.rows[0],
      clients: clients.rows[0],
      properties: properties.rows[0],
      deals: dealsStats.rows[0],
      activity: activity.rows,
    };
  }

  private resolvePeriod(period: string, from_date?: string, to_date?: string) {
    if (from_date && to_date) {
      return { dateFrom: from_date, dateTo: to_date };
    }
    const now = new Date();
    const fmt = (d: Date) => d.toISOString();

    switch (period) {
      case 'day':    return { dateFrom: fmt(new Date(now.setHours(0,0,0,0))), dateTo: fmt(new Date()) };
      case 'week':   return { dateFrom: fmt(new Date(Date.now() - 7 * 864e5)), dateTo: fmt(new Date()) };
      case 'month':  return { dateFrom: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), dateTo: fmt(new Date()) };
      case 'quarter':{
        const q = Math.floor(now.getMonth() / 3);
        return { dateFrom: fmt(new Date(now.getFullYear(), q * 3, 1)), dateTo: fmt(new Date()) };
      }
      case 'year':   return { dateFrom: fmt(new Date(now.getFullYear(), 0, 1)), dateTo: fmt(new Date()) };
      default:       return { dateFrom: fmt(new Date('2000-01-01')), dateTo: fmt(new Date()) };
    }
  }
}
