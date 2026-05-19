import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator.js';
import type { CreateDemandDto } from './dto/create-demand.dto.js';
import type { JwtPayload } from '../../common/types/jwt-payload.type.js';
import { Role } from '../../common/enums/role.enum.js';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { MATCHING_QUEUE, MATCHING_JOBS } from '../../queue/queue.constants.js';

@Injectable()
export class DemandsService {
  constructor(
    @Inject(DB_POOL) private db: Pool,
    @InjectQueue(MATCHING_QUEUE) private matchingQueue: Queue,
  ) {}

  async findAll(actor: JwtPayload, status?: string) {
    const isAdmin = [Role.ADMIN, Role.SUPERADMIN].includes(actor.role as Role);
    const result = await this.db.query(
      `SELECT d.*, u.full_name AS agent_name
       FROM demands d
       JOIN users u ON u.id = d.agent_id
       WHERE ($1::boolean OR d.agent_id = $2)
         AND ($3::text IS NULL OR d.kanban_status = $3)
       ORDER BY d.updated_at DESC`,
      [isAdmin, actor.sub, status ?? null],
    );
    return result.rows;
  }

  async findOne(id: string, actor: JwtPayload) {
    const result = await this.db.query(
      `SELECT d.*, u.full_name AS agent_name FROM demands d
       JOIN users u ON u.id = d.agent_id
       WHERE d.id = $1`,
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
         agent_id, buyer_name, buyer_phone, budget_min, budget_max,
         property_type, rooms, districts, repair_types, payment_forms,
         area_min, area_max, floor_min, floor_max, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        actor.sub,
        dto.buyer_name, dto.buyer_phone,
        dto.budget_min ?? null, dto.budget_max,
        dto.property_type,
        dto.rooms ?? [], dto.districts ?? [],
        dto.repair_types ?? [], dto.payment_forms ?? [],
        dto.area_min ?? null, dto.area_max ?? null,
        dto.floor_min ?? null, dto.floor_max ?? null,
        dto.notes ?? null,
      ],
    );
    const demand = result.rows[0];

    await this.matchingQueue.add(MATCHING_JOBS.RECALC_DEMAND, { demandId: demand.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return demand;
  }

  async update(id: string, dto: Partial<CreateDemandDto>, actor: JwtPayload) {
    await this.findOne(id, actor);

    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const updatable = [
      'buyer_name', 'buyer_phone', 'budget_min', 'budget_max',
      'rooms', 'districts', 'repair_types', 'payment_forms',
      'area_min', 'area_max', 'notes',
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

    return result.rows[0];
  }

  async updateKanbanStatus(id: string, status: string, actor: JwtPayload) {
    await this.findOne(id, actor);
    const result = await this.db.query(
      'UPDATE demands SET kanban_status = $1 WHERE id = $2 RETURNING *',
      [status, id],
    );
    return result.rows[0];
  }

  async delete(id: string, actor: JwtPayload) {
    await this.findOne(id, actor);
    await this.db.query('DELETE FROM demands WHERE id = $1', [id]);
    return { success: true };
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
    // Touch demand updated_at to reset stale timer
    await this.db.query('UPDATE demands SET updated_at = NOW() WHERE id = $1', [demandId]);
    return result.rows[0];
  }
}
