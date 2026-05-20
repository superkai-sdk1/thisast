import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDb } from '@crm/shared-core';
import type { Pool } from 'pg';

export interface ComplexFilter {
  q?: string;
  district?: string;
  class?: string;
  year_delivery?: number;
}

export interface CreateComplexDto {
  name: string;
  developer?: string;
  class?: string;
  district?: string;
  address?: string;
  description?: string;
  year_delivery?: number;
  total_floors?: number;
}

@Injectable()
export class ComplexesService {
  constructor(@InjectDb() private db: Pool) {}

  async findAll(filter: ComplexFilter = {}) {
    const conditions: string[] = ['rc.is_active = true'];
    const params: unknown[] = [];
    let i = 1;

    if (filter.q) {
      conditions.push(`(rc.name ILIKE $${i} OR rc.developer ILIKE $${i} OR rc.district ILIKE $${i})`);
      params.push(`%${filter.q}%`);
      i++;
    }
    if (filter.district) {
      conditions.push(`rc.district = $${i++}`);
      params.push(filter.district);
    }
    if (filter.class) {
      conditions.push(`rc.class = $${i++}::complex_class`);
      params.push(filter.class);
    }
    if (filter.year_delivery) {
      conditions.push(`rc.year_delivery = $${i++}`);
      params.push(filter.year_delivery);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.db.query(
      `SELECT rc.*,
              COUNT(p.id) FILTER (WHERE p.deleted_at IS NULL)::int AS property_count,
              MIN(p.price) FILTER (WHERE p.deleted_at IS NULL) AS min_price,
              json_agg(cp ORDER BY cp.display_order) FILTER (WHERE cp.id IS NOT NULL) AS photos
       FROM residential_complexes rc
       LEFT JOIN properties p ON p.complex_id = rc.id
       LEFT JOIN complex_photos cp ON cp.complex_id = rc.id
       ${where}
       GROUP BY rc.id
       ORDER BY rc.created_at DESC`,
      params,
    );
    return result.rows;
  }

  async findOne(id: string) {
    const result = await this.db.query(
      `SELECT rc.*,
              COUNT(p.id) FILTER (WHERE p.deleted_at IS NULL)::int AS property_count,
              MIN(p.price) FILTER (WHERE p.deleted_at IS NULL) AS min_price,
              json_agg(cp ORDER BY cp.display_order) FILTER (WHERE cp.id IS NOT NULL) AS photos
       FROM residential_complexes rc
       LEFT JOIN properties p ON p.complex_id = rc.id
       LEFT JOIN complex_photos cp ON cp.complex_id = rc.id
       WHERE rc.id = $1
       GROUP BY rc.id`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('ЖК не найден');
    return result.rows[0];
  }

  async create(dto: CreateComplexDto, actorId: string) {
    const result = await this.db.query(
      `INSERT INTO residential_complexes
         (name, developer, class, district, address, description, year_delivery, total_floors, created_by)
       VALUES ($1, $2, $3::complex_class, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        dto.name,
        dto.developer ?? null,
        dto.class ?? null,
        dto.district ?? null,
        dto.address ?? null,
        dto.description ?? null,
        dto.year_delivery ?? null,
        dto.total_floors ?? null,
        actorId,
      ],
    );
    return { ...result.rows[0], photos: [], property_count: 0, min_price: null };
  }

  async update(id: string, dto: Partial<CreateComplexDto>) {
    const r = await this.db.query(
      `UPDATE residential_complexes SET
         name          = COALESCE($1, name),
         developer     = COALESCE($2, developer),
         class         = COALESCE($3::complex_class, class),
         district      = COALESCE($4, district),
         address       = COALESCE($5, address),
         description   = COALESCE($6, description),
         year_delivery = COALESCE($7, year_delivery),
         total_floors  = COALESCE($8, total_floors)
       WHERE id = $9 RETURNING *`,
      [
        dto.name ?? null,
        dto.developer ?? null,
        dto.class ?? null,
        dto.district ?? null,
        dto.address ?? null,
        dto.description ?? null,
        dto.year_delivery ?? null,
        dto.total_floors ?? null,
        id,
      ],
    );
    if (!r.rows[0]) throw new NotFoundException('ЖК не найден');
    return r.rows[0];
  }

  async delete(id: string) {
    await this.db.query('UPDATE residential_complexes SET is_active = false WHERE id = $1', [id]);
    return { success: true };
  }

  async addPhoto(complexId: string, url: string, isCover: boolean) {
    if (isCover) {
      await this.db.query('UPDATE complex_photos SET is_cover = false WHERE complex_id = $1', [complexId]);
    }
    const maxOrder = await this.db.query(
      'SELECT COALESCE(MAX(display_order), -1) AS max FROM complex_photos WHERE complex_id = $1',
      [complexId],
    );
    const order = (maxOrder.rows[0].max as number) + 1;
    const r = await this.db.query(
      `INSERT INTO complex_photos (complex_id, url, display_order, is_cover) VALUES ($1, $2, $3, $4) RETURNING *`,
      [complexId, url, order, isCover],
    );
    return r.rows[0];
  }

  async deletePhoto(photoId: string) {
    await this.db.query('DELETE FROM complex_photos WHERE id = $1', [photoId]);
    return { success: true };
  }
}
