import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator.js';
import type { CreatePropertyDto } from './dto/create-property.dto.js';
import type { JwtPayload } from '../../common/types/jwt-payload.type.js';
import { Role } from '../../common/enums/role.enum.js';
import { SearchService } from '../search/search.service.js';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { MATCHING_QUEUE } from '../../queue/queue.constants.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditAction } from '../../common/enums/audit-action.enum.js';

interface PropertyFilter {
  type?: string;
  visibility?: string;
  base?: 'own' | 'global' | 'agency';
  price_min?: number;
  price_max?: number;
  district?: string;
  rooms?: number[];
  area_min?: number;
  area_max?: number;
  q?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(DB_POOL) private db: Pool,
    private searchService: SearchService,
    @InjectQueue(MATCHING_QUEUE) private matchingQueue: Queue,
    private auditLog: AuditLogService,
  ) {}

  async findAll(filter: PropertyFilter, actor: JwtPayload) {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const canViewGlobal = await this.checkPermission(actor.sub, 'can_view_global_database');

    let whereClause = 'p.deleted_at IS NULL';
    const params: unknown[] = [];
    let idx = 1;

    if (filter.base === 'own') {
      whereClause += ` AND p.owner_agent_id = $${idx++}`;
      params.push(actor.sub);
    } else if (filter.base === 'global' && canViewGlobal) {
      whereClause += ` AND p.visibility_status IN ('shared', 'public')`;
    } else {
      // Default: own + shared visible to this agent's agency
      whereClause += ` AND (p.owner_agent_id = $${idx++} OR p.visibility_status IN ('shared', 'public'))`;
      params.push(actor.sub);
    }

    if (filter.type) {
      whereClause += ` AND p.property_type = $${idx++}`;
      params.push(filter.type);
    }
    if (filter.price_min) { whereClause += ` AND p.price >= $${idx++}`; params.push(filter.price_min); }
    if (filter.price_max) { whereClause += ` AND p.price <= $${idx++}`; params.push(filter.price_max); }
    if (filter.district) { whereClause += ` AND p.district = $${idx++}`; params.push(filter.district); }
    if (filter.area_min) { whereClause += ` AND p.area_sqm >= $${idx++}`; params.push(filter.area_min); }
    if (filter.area_max) { whereClause += ` AND p.area_sqm <= $${idx++}`; params.push(filter.area_max); }
    if (filter.rooms?.length) {
      whereClause += ` AND p.rooms = ANY($${idx++}::smallint[])`;
      params.push(filter.rooms);
    }

    const [rows, count] = await Promise.all([
      this.db.query(
        `SELECT p.*,
                json_agg(pp ORDER BY pp.display_order) FILTER (WHERE pp.id IS NOT NULL) AS photos
         FROM properties p
         LEFT JOIN property_photos pp ON pp.property_id = p.id
         WHERE ${whereClause}
         GROUP BY p.id
         ORDER BY p.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset],
      ),
      this.db.query(`SELECT COUNT(*) FROM properties p WHERE ${whereClause}`, params),
    ]);

    return {
      items: rows.rows,
      total: Number(count.rows[0].count),
      page,
      limit,
      has_next: page * limit < Number(count.rows[0].count),
    };
  }

  async findOne(id: string, actor: JwtPayload) {
    const result = await this.db.query(
      `SELECT p.*,
              json_agg(pp ORDER BY pp.display_order) FILTER (WHERE pp.id IS NOT NULL) AS photos
       FROM properties p
       LEFT JOIN property_photos pp ON pp.property_id = p.id
       WHERE p.id = $1 AND p.deleted_at IS NULL
       GROUP BY p.id`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Объект не найден');

    const prop = result.rows[0];
    if (prop.owner_agent_id !== actor.sub && prop.visibility_status === 'private' && actor.role === Role.AGENT) {
      throw new ForbiddenException('Нет доступа к этому объекту');
    }
    return prop;
  }

  async create(dto: CreatePropertyDto, actor: JwtPayload) {
    const result = await this.db.query(
      `INSERT INTO properties (
         owner_agent_id, owner_id, visibility_status, property_type,
         city, district, street, house_number, apartment_number,
         price, area_sqm, rooms, floor, floor_total, ceiling_height,
         conditions, tags, description
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        actor.sub,
        dto.owner_id ?? null,
        dto.visibility_status ?? 'private',
        dto.property_type,
        dto.city,
        dto.district ?? null,
        dto.street ?? null,
        dto.house_number ?? null,
        dto.apartment_number ?? null,
        dto.price,
        dto.area_sqm ?? null,
        dto.rooms ?? null,
        dto.floor ?? null,
        dto.floor_total ?? null,
        dto.ceiling_height ?? null,
        dto.conditions ?? [],
        dto.tags ?? [],
        dto.description ?? null,
      ],
    );
    const property = result.rows[0];

    // Sync to Meilisearch
    await this.searchService.indexProperty(property).catch(console.error);

    // Trigger matching for shared/public properties
    if (['shared', 'public'].includes(property.visibility_status)) {
      await this.matchingQueue.add('RECALC_PROPERTY', { propertyId: property.id });
    }

    await this.auditLog.log({ actor_id: actor.sub, action_type: AuditAction.CREATE_RECORD, target_type: 'property', target_id: property.id });
    return property;
  }

  async update(id: string, dto: Partial<CreatePropertyDto>, actor: JwtPayload) {
    const property = await this.findOne(id, actor);

    if (property.owner_agent_id !== actor.sub && actor.role === Role.AGENT) {
      throw new ForbiddenException('Нельзя редактировать чужой объект');
    }

    const oldPrice = property.price;
    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const updatable: (keyof CreatePropertyDto)[] = [
      'price', 'area_sqm', 'rooms', 'floor', 'floor_total', 'description',
      'district', 'street', 'house_number', 'conditions', 'tags', 'visibility_status',
    ];

    for (const key of updatable) {
      if (dto[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        params.push(dto[key]);
      }
    }

    if (!fields.length) return property;
    params.push(id);

    const result = await this.db.query(
      `UPDATE properties SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
    const updated = result.rows[0];

    await this.searchService.indexProperty(updated).catch(console.error);
    await this.auditLog.log({ actor_id: actor.sub, action_type: AuditAction.UPDATE_RECORD, target_type: 'property', target_id: id, metadata: { old_price: oldPrice, new_price: updated.price } });

    return updated;
  }

  async updateVisibility(id: string, visibility: string, actor: JwtPayload) {
    const property = await this.findOne(id, actor);
    if (property.owner_agent_id !== actor.sub && actor.role === Role.AGENT) {
      throw new ForbiddenException('Нельзя изменить видимость чужого объекта');
    }
    const result = await this.db.query(
      'UPDATE properties SET visibility_status = $1 WHERE id = $2 RETURNING *',
      [visibility, id],
    );
    await this.auditLog.log({
      actor_id: actor.sub,
      action_type: AuditAction.CHANGE_VISIBILITY,
      target_type: 'property',
      target_id: id,
      metadata: { old: property.visibility_status, new: visibility },
    });

    if (['shared', 'public'].includes(visibility)) {
      await this.matchingQueue.add('RECALC_PROPERTY', { propertyId: id });
    }
    return result.rows[0];
  }

  async softDelete(id: string, actor: JwtPayload) {
    const property = await this.findOne(id, actor);
    const canDelete = await this.checkPermission(actor.sub, 'can_delete_records');
    if (property.owner_agent_id !== actor.sub && !canDelete && actor.role === Role.AGENT) {
      throw new ForbiddenException('Нет прав на удаление');
    }
    await this.db.query('UPDATE properties SET deleted_at = NOW() WHERE id = $1', [id]);
    await this.searchService.deleteProperty(id).catch(console.error);
    await this.auditLog.log({ actor_id: actor.sub, action_type: AuditAction.DELETE_RECORD, target_type: 'property', target_id: id });
    return { success: true };
  }

  async getMatches(propertyId: string, limit = 10) {
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

  private async checkPermission(userId: string, flag: string): Promise<boolean> {
    const result = await this.db.query<{ permission_flags: Record<string, boolean> }>(
      'SELECT permission_flags FROM users WHERE id = $1',
      [userId],
    );
    return result.rows[0]?.permission_flags?.[flag] ?? false;
  }
}
