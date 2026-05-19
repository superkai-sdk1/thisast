import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectDb } from '@crm/shared-core';
import type { Pool } from 'pg';
import { SearchService } from '../search/search.service.js';

export interface PropertyFilter {
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

export interface ActorPayload {
  sub: string;
  role: string;
}

export interface CreatePropertyDto {
  owner_id?: string;
  visibility_status?: string;
  property_type: string;
  city: string;
  district?: string;
  street?: string;
  house_number?: string;
  apartment_number?: string;
  price: number;
  area_sqm?: number;
  rooms?: number;
  floor?: number;
  floor_total?: number;
  ceiling_height?: number;
  conditions?: string[];
  tags?: string[];
  description?: string;
}

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectDb() private db: Pool,
    private searchService: SearchService,
  ) {}

  async findAll(filter: PropertyFilter, actor: ActorPayload) {
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
      whereClause += ` AND (p.owner_agent_id = $${idx++} OR p.visibility_status IN ('shared', 'public'))`;
      params.push(actor.sub);
    }

    if (filter.type) { whereClause += ` AND p.property_type = $${idx++}`; params.push(filter.type); }
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

  async findOne(id: string, actor: ActorPayload) {
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
    if (prop.owner_agent_id !== actor.sub && prop.visibility_status === 'private' && actor.role === 'agent') {
      throw new ForbiddenException('Нет доступа к этому объекту');
    }
    return prop;
  }

  async create(dto: CreatePropertyDto, actor: ActorPayload) {
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

    await this.searchService.indexProperty(property).catch((e) => this.logger.error('search index failed', e));

    return property;
  }

  async update(id: string, dto: Partial<CreatePropertyDto>, actor: ActorPayload) {
    const property = await this.findOne(id, actor);

    if (property.owner_agent_id !== actor.sub && actor.role === 'agent') {
      throw new ForbiddenException('Нельзя редактировать чужой объект');
    }

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

    await this.searchService.indexProperty(updated).catch((e) => this.logger.error('search index failed', e));

    return { updated, oldPrice: property.price };
  }

  async updateVisibility(id: string, visibility: string, actor: ActorPayload) {
    const property = await this.findOne(id, actor);
    if (property.owner_agent_id !== actor.sub && actor.role === 'agent') {
      throw new ForbiddenException('Нельзя изменить видимость чужого объекта');
    }
    const result = await this.db.query(
      'UPDATE properties SET visibility_status = $1 WHERE id = $2 RETURNING *',
      [visibility, id],
    );
    return { updated: result.rows[0], oldVisibility: property.visibility_status };
  }

  async softDelete(id: string, actor: ActorPayload) {
    const property = await this.findOne(id, actor);
    const canDelete = await this.checkPermission(actor.sub, 'can_delete_records');
    if (property.owner_agent_id !== actor.sub && !canDelete && actor.role === 'agent') {
      throw new ForbiddenException('Нет прав на удаление');
    }
    await this.db.query('UPDATE properties SET deleted_at = NOW() WHERE id = $1', [id]);
    await this.searchService.deleteProperty(id).catch((e) => this.logger.error('search delete failed', e));
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
