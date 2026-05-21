import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator';
import type { CreateDemandDto } from './dto/create-demand.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { Role } from '../../common/enums/role.enum';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { MATCHING_QUEUE, MATCHING_JOBS } from '../../queue/queue.constants';

interface DemandFilter {
  client_type?: string;
  temperature?: string;
  is_active?: boolean;
  kanban_status?: string;
  property_type?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class DemandsService {
  constructor(
    @Inject(DB_POOL) private db: Pool,
    @InjectQueue(MATCHING_QUEUE) private matchingQueue: Queue,
  ) {}

  async findAll(actor: JwtPayload, filter: DemandFilter = {}) {
    const isAdmin = [Role.ADMIN, Role.SUPERADMIN].includes(actor.role as Role);
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 50, 200);
    const offset = (page - 1) * limit;

    const params: unknown[] = [isAdmin, actor.sub];
    let idx = 3;
    let whereExtra = '';

    if (filter.client_type) { whereExtra += ` AND d.client_type = $${idx++}`; params.push(filter.client_type); }
    if (filter.temperature)  { whereExtra += ` AND d.temperature = $${idx++}`; params.push(filter.temperature); }
    if (filter.is_active !== undefined) { whereExtra += ` AND d.is_active = $${idx++}`; params.push(filter.is_active); }
    if (filter.kanban_status) { whereExtra += ` AND d.kanban_status = $${idx++}`; params.push(filter.kanban_status); }
    if (filter.property_type) { whereExtra += ` AND d.property_type = $${idx++}`; params.push(filter.property_type); }

    const result = await this.db.query(
      `SELECT d.*, u.full_name AS agent_name
       FROM demands d
       JOIN users u ON u.id = d.agent_id
       WHERE ($1::boolean OR d.agent_id = $2)
         AND d.deleted_at IS NULL
         ${whereExtra}
       ORDER BY d.updated_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
    );
    return result.rows;
  }

  async findOne(id: string, actor: JwtPayload) {
    const result = await this.db.query(
      `SELECT d.*, u.full_name AS agent_name FROM demands d
       JOIN users u ON u.id = d.agent_id
       WHERE d.id = $1 AND d.deleted_at IS NULL`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Заявка не найдена');
    const demand = result.rows[0];
    if (demand.agent_id !== actor.sub && actor.role === Role.AGENT) {
      throw new ForbiddenException('Нет доступа к этой заявке');
    }
    return demand;
  }

  async create(dto: CreateDemandDto, actor: JwtPayload) {
    const result = await this.db.query(
      `INSERT INTO demands (
         agent_id, buyer_name, buyer_phone,
         client_type, temperature, is_active,
         budget_min, budget_max, property_type, market_type,
         net_price, rent_price, deposit, utilities_included,
         rooms, districts, repair_types, payment_forms,
         area_min, area_max, floor_min, floor_max,
         first_contact_at, last_contact_at, next_contact_at,
         notes, demand_notes
       ) VALUES (
         $1,$2,$3,
         $4,$5,$6,
         $7,$8,$9,$10,
         $11,$12,$13,$14,
         $15,$16,$17,$18,
         $19,$20,$21,$22,
         $23,$24,$25,
         $26,$27
       ) RETURNING *`,
      [
        actor.sub, dto.buyer_name, dto.buyer_phone,
        dto.client_type ?? 'buyer', dto.temperature ?? null, dto.is_active ?? true,
        dto.budget_min ?? null, dto.budget_max ?? null,
        dto.property_type ?? null, dto.market_type ?? null,
        dto.net_price ?? null, dto.rent_price ?? null,
        dto.deposit ?? null, dto.utilities_included ?? null,
        dto.rooms ?? [], dto.districts ?? [],
        dto.repair_types ?? [], dto.payment_forms ?? [],
        dto.area_min ?? null, dto.area_max ?? null,
        dto.floor_min ?? null, dto.floor_max ?? null,
        dto.first_contact_at ?? null, dto.last_contact_at ?? null, dto.next_contact_at ?? null,
        dto.notes ?? null, dto.demand_notes ?? null,
      ],
    );
    const demand = result.rows[0];

    await this.matchingQueue.add(MATCHING_JOBS.RECALC_DEMAND, { demandId: demand.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    await this.writeEvent(demand.id, 'created', actor.sub, 'Клиент создан');

    return demand;
  }

  async update(id: string, dto: Partial<CreateDemandDto>, actor: JwtPayload) {
    await this.findOne(id, actor);

    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const updatable = [
      'buyer_name', 'buyer_phone', 'client_type', 'temperature', 'is_active',
      'budget_min', 'budget_max', 'property_type', 'market_type',
      'net_price', 'rent_price', 'deposit', 'utilities_included',
      'rooms', 'districts', 'repair_types', 'payment_forms',
      'area_min', 'area_max', 'floor_min', 'floor_max',
      'first_contact_at', 'last_contact_at', 'next_contact_at',
      'notes', 'demand_notes',
    ] as const;

    for (const key of updatable) {
      if ((dto as Record<string, unknown>)[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        params.push((dto as Record<string, unknown>)[key]);
      }
    }

    if (!fields.length) return this.findOne(id, actor);
    params.push(id);

    const result = await this.db.query(
      `UPDATE demands SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );

    await this.matchingQueue.add(MATCHING_JOBS.RECALC_DEMAND, { demandId: id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    await this.writeEvent(id, 'updated', actor.sub, 'Данные клиента обновлены');

    return result.rows[0];
  }

  async updateKanbanStatus(id: string, status: string, actor: JwtPayload) {
    await this.findOne(id, actor);
    const result = await this.db.query(
      'UPDATE demands SET kanban_status = $1 WHERE id = $2 RETURNING *',
      [status, id],
    );
    await this.writeEvent(id, 'status_changed', actor.sub, `Воронка: ${status}`);
    return result.rows[0];
  }

  async delete(id: string, actor: JwtPayload) {
    await this.findOne(id, actor);
    await this.writeEvent(id, 'deleted', actor.sub, 'Клиент удалён');
    await this.db.query('UPDATE demands SET deleted_at = NOW() WHERE id = $1', [id]);
    return { success: true };
  }

  async listTrashed(actor: JwtPayload) {
    const isAdmin = [Role.ADMIN, Role.SUPERADMIN].includes(actor.role as Role);
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const result = await this.db.query(
      `SELECT d.*, u.full_name AS agent_name
       FROM demands d
       JOIN users u ON u.id = d.agent_id
       WHERE d.deleted_at IS NOT NULL AND d.deleted_at >= $1
         AND ($2::boolean OR d.agent_id = $3)
       ORDER BY d.deleted_at DESC`,
      [cutoff, isAdmin, actor.sub],
    );
    return result.rows;
  }

  async restore(id: string, actor: JwtPayload) {
    const isAdmin = [Role.ADMIN, Role.SUPERADMIN].includes(actor.role as Role);
    const result = await this.db.query(
      `UPDATE demands SET deleted_at = NULL
       WHERE id = $1 AND deleted_at IS NOT NULL AND ($2::boolean OR agent_id = $3)
       RETURNING *`,
      [id, isAdmin, actor.sub],
    );
    if (!result.rows[0]) throw new NotFoundException('Заявка не найдена в корзине');
    return result.rows[0];
  }

  async getMatches(demandId: string, limit = 10) {
    const result = await this.db.query(
      `SELECT dpm.*, p.city, p.district, p.price, p.rooms, p.area_sqm,
              p.property_type, p.visibility_status,
              (SELECT pp.url FROM property_photos pp WHERE pp.property_id = p.id AND pp.is_cover ORDER BY pp.display_order LIMIT 1) AS cover_url
       FROM demand_property_matches dpm
       JOIN properties p ON p.id = dpm.property_id
       WHERE dpm.demand_id = $1 AND NOT dpm.is_dismissed AND p.deleted_at IS NULL
       ORDER BY dpm.score DESC
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
    await this.db.query('UPDATE demands SET updated_at = NOW() WHERE id = $1', [demandId]);
    return result.rows[0];
  }

  async getEvents(demandId: string) {
    const result = await this.db.query(
      `SELECT ee.*, u.full_name AS user_name
       FROM entity_events ee
       LEFT JOIN users u ON u.id = ee.user_id
       WHERE ee.entity_type = 'demand' AND ee.entity_id = $1
       ORDER BY ee.created_at DESC
       LIMIT 100`,
      [demandId],
    );
    return result.rows;
  }

  async markContactOverdue() {
    await this.db.query(`
      UPDATE demands
      SET is_contact_overdue = TRUE
      WHERE next_contact_at IS NOT NULL
        AND next_contact_at < NOW() - INTERVAL '24 hours'
        AND is_active = TRUE
        AND is_contact_overdue = FALSE
    `);
  }

  private async writeEvent(
    demandId: string,
    eventType: string,
    userId: string,
    description: string,
    oldValue?: string,
    newValue?: string,
  ) {
    await this.db.query(
      `INSERT INTO entity_events (entity_type, entity_id, event_type, user_id, description, old_value, new_value)
       VALUES ('demand', $1, $2, $3, $4, $5, $6)`,
      [demandId, eventType, userId, description, oldValue ?? null, newValue ?? null],
    ).catch(() => null);
  }
}
