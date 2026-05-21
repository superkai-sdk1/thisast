import { Injectable, Inject } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import type { Pool } from 'pg';
import { InjectDb } from '@crm/shared-core';
import type { JwtPayload } from '@crm/shared-core';
import { EVT_DEMAND_CREATED, EVT_DEMAND_UPDATED } from '@crm/shared-types';
import { REDIS_CLIENT } from '../redis-client.module';

const Role = {
  AGENT: 'agent',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

function parsePostgresArray(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    if (val === '{}' || val === '') return [];
    return val.replace(/^{|}$/g, '').split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function parseDemandRow(row: Record<string, unknown>): Record<string, unknown> {
  for (const key of ['repair_types', 'payment_forms', 'internal_tags', 'districts', 'rooms']) {
    if (row[key] !== undefined) {
      row[key] = parsePostgresArray(row[key]);
    }
  }
  return row;
}

@Injectable()
export class DemandsService {
  constructor(
    @InjectDb() private db: Pool,
    @Inject(REDIS_CLIENT) private redisClient: ClientProxy,
  ) {}

  async findAll(actor: JwtPayload, filter: Record<string, unknown> = {}) {
    const isAdmin = ([Role.ADMIN, Role.SUPERADMIN] as string[]).includes(actor.role);

    const conditions: string[] = [
      '($1::boolean OR d.agent_id = $2)',
      'd.deleted_at IS NULL',
    ];
    const params: unknown[] = [isAdmin, actor.sub];
    let idx = 3;

    if (filter['status']) {
      conditions.push(`d.kanban_status = $${idx++}::kanban_status`);
      params.push(filter['status']);
    }
    if (filter['client_type']) {
      conditions.push(`d.client_type = $${idx++}`);
      params.push(filter['client_type']);
    }
    if (filter['is_active'] !== undefined && filter['is_active'] !== '') {
      conditions.push(`d.is_active = $${idx++}`);
      params.push(filter['is_active'] === 'true' || filter['is_active'] === true);
    }
    if (filter['temperature']) {
      conditions.push(`d.temperature = $${idx++}`);
      params.push(filter['temperature']);
    }
    if (filter['q']) {
      conditions.push(`(d.buyer_name ILIKE $${idx} OR d.buyer_phone ILIKE $${idx})`);
      params.push(`%${filter['q']}%`);
      idx++;
    }

    const result = await this.db.query(
      `SELECT d.*, u.full_name AS agent_name
       FROM demands d
       JOIN users u ON u.id = d.agent_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY d.updated_at DESC`,
      params,
    );
    return result.rows.map(parseDemandRow);
  }

  async listTrashed(actor: JwtPayload) {
    const isAdmin = ([Role.ADMIN, Role.SUPERADMIN] as string[]).includes(actor.role);
    const result = await this.db.query(
      `SELECT d.*, u.full_name AS agent_name
       FROM demands d
       JOIN users u ON u.id = d.agent_id
       WHERE ($1::boolean OR d.agent_id = $2)
         AND d.deleted_at IS NOT NULL
         AND d.deleted_at >= NOW() - INTERVAL '14 days'
       ORDER BY d.deleted_at DESC`,
      [isAdmin, actor.sub],
    );
    return result.rows.map(parseDemandRow);
  }

  async restore(id: string, actor: JwtPayload) {
    const result = await this.db.query(
      `UPDATE demands SET deleted_at = NULL, updated_at = NOW()
       WHERE id = $1 AND ($2::boolean OR agent_id = $3)
       RETURNING *`,
      [id, ([Role.ADMIN, Role.SUPERADMIN] as string[]).includes(actor.role), actor.sub],
    );
    if (!result.rows[0]) throw new RpcException({ statusCode: 404, message: 'Заявка не найдена' });
    return parseDemandRow(result.rows[0]);
  }

  async findOne(id: string, actor: JwtPayload) {
    const result = await this.db.query(
      `SELECT d.*, u.full_name AS agent_name FROM demands d
       JOIN users u ON u.id = d.agent_id
       WHERE d.id = $1 AND d.deleted_at IS NULL`,
      [id],
    );
    if (!result.rows[0]) throw new RpcException({ statusCode: 404, message: 'Заявка не найдена' });
    const demand = parseDemandRow(result.rows[0]);
    if (demand['agent_id'] !== actor.sub && actor.role === Role.AGENT) {
      throw new RpcException({ statusCode: 403, message: 'Нет доступа к этой заявке' });
    }
    return demand;
  }

  async create(dto: Record<string, unknown>, actor: JwtPayload) {
    const result = await this.db.query(
      `INSERT INTO demands (
         agent_id, buyer_name, buyer_phone, budget_min, budget_max,
         property_type, rooms, districts, repair_types, payment_forms,
         area_min, area_max, floor_min, floor_max, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        actor.sub,
        dto['buyer_name'],
        dto['buyer_phone'],
        dto['budget_min'] ?? null,
        dto['budget_max'],
        dto['property_type'],
        dto['rooms'] ?? [],
        dto['districts'] ?? [],
        dto['repair_types'] ?? [],
        dto['payment_forms'] ?? [],
        dto['area_min'] ?? null,
        dto['area_max'] ?? null,
        dto['floor_min'] ?? null,
        dto['floor_max'] ?? null,
        dto['notes'] ?? null,
      ],
    );
    const demand = parseDemandRow(result.rows[0]);

    this.redisClient.emit(EVT_DEMAND_CREATED, { demandId: (demand as Record<string, unknown>)['id'] });

    return demand;
  }

  async update(id: string, dto: Record<string, unknown>, actor: JwtPayload) {
    await this.findOne(id, actor);

    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const updatable = [
      'buyer_name', 'buyer_phone', 'budget_min', 'budget_max',
      'rooms', 'districts', 'repair_types', 'payment_forms',
      'area_min', 'area_max', 'notes',
    ];

    for (const key of updatable) {
      if (dto[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        params.push(dto[key]);
      }
    }

    if (!fields.length) return this.findOne(id, actor);
    params.push(id);

    const result = await this.db.query(
      `UPDATE demands SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );

    this.redisClient.emit(EVT_DEMAND_UPDATED, { demandId: id });

    return parseDemandRow(result.rows[0]);
  }

  async updateKanbanStatus(id: string, status: string, actor: JwtPayload) {
    await this.findOne(id, actor);
    const result = await this.db.query(
      'UPDATE demands SET kanban_status = $1 WHERE id = $2 RETURNING *',
      [status, id],
    );
    return parseDemandRow(result.rows[0]);
  }

  async delete(id: string, actor: JwtPayload) {
    await this.findOne(id, actor);
    await this.db.query('UPDATE demands SET deleted_at = NOW() WHERE id = $1', [id]);
    return { success: true };
  }

  async getMatches(demandId: string, limit = 10) {
    const result = await this.db.query(
      `SELECT dm.*, p.district, p.street, p.house_number, p.price, p.area_sqm, p.rooms
       FROM demand_property_matches dm
       JOIN properties p ON p.id = dm.property_id
       WHERE dm.demand_id = $1 AND dm.is_dismissed = false
       ORDER BY dm.score DESC
       LIMIT $2`,
      [demandId, limit],
    );
    return result.rows;
  }

  async getActivity(demandId: string) {
    const result = await this.db.query(
      `SELECT al.*, u.full_name AS agent_name
       FROM activity_logs al
       JOIN users u ON u.id = al.agent_id
       WHERE al.demand_id = $1
       ORDER BY al.created_at DESC`,
      [demandId],
    );
    return result.rows;
  }

  async addActivity(demandId: string, type: string, body: string, actor: JwtPayload) {
    const result = await this.db.query(
      `INSERT INTO activity_logs (demand_id, agent_id, activity_type, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [demandId, actor.sub, type, body],
    );
    // Touch demand updated_at to reset stale timer
    await this.db.query('UPDATE demands SET updated_at = NOW() WHERE id = $1', [demandId]);
    return result.rows[0];
  }
}
