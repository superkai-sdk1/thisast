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
  // migration 007 fields
  ceiling_height?: number;
  has_panoramic_windows?: boolean;
  building_type?: string;
  entrances_count?: number;
  apartments_count?: number;
  parking_spots?: number;
  elevator_passenger?: number;
  elevator_cargo?: number;
  elevator_cargo_pass?: number;
  parking_types?: string[];
  has_closed_territory?: boolean;
  has_playground?: boolean;
  has_sports_ground?: boolean;
  finish_type?: string;
  has_gas?: boolean;
  custom_params?: Record<string, unknown>;
  payment_cash_sqm?: number;
  payment_inst_sqm?: number;
  payment_inst_months?: number;
  payment_inst_initial?: number;
  payment_mort_sqm?: number;
  payment_mort_rate?: number;
  payment_mort_months?: number;
  payment_mort_initial?: number;
  has_barter?: boolean;
  conditions_notes?: string;
}

export interface CreateApartmentDto {
  area: number;
  floor?: number;
  entrance?: number;
  rooms?: number;
  window_view?: string;
  layout_desc?: string;
  status?: string;
}

@Injectable()
export class ComplexesService {
  constructor(@InjectDb() private db: Pool) {}

  async findAll(filter: ComplexFilter = {}) {
    const conditions: string[] = ['rc.deleted_at IS NULL'];
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
       WHERE rc.id = $1 AND rc.deleted_at IS NULL
       GROUP BY rc.id`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('ЖК не найден');
    return result.rows[0];
  }

  async create(dto: CreateComplexDto, actorId: string) {
    const result = await this.db.query(
      `INSERT INTO residential_complexes
         (name, developer, class, district, address, description, year_delivery, total_floors, created_by,
          ceiling_height, has_panoramic_windows, building_type, entrances_count, apartments_count, parking_spots,
          elevator_passenger, elevator_cargo, elevator_cargo_pass, parking_types,
          has_closed_territory, has_playground, has_sports_ground, finish_type, has_gas,
          custom_params,
          payment_cash_sqm, payment_inst_sqm, payment_inst_months, payment_inst_initial,
          payment_mort_sqm, payment_mort_rate, payment_mort_months, payment_mort_initial,
          has_barter, conditions_notes)
       VALUES ($1,$2,$3::complex_class,$4,$5,$6,$7,$8,$9,
               $10,$11,$12,$13,$14,$15,
               $16,$17,$18,$19,
               $20,$21,$22,$23,$24,
               $25,
               $26,$27,$28,$29,
               $30,$31,$32,$33,
               $34,$35)
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
        dto.ceiling_height ?? null,
        dto.has_panoramic_windows ?? null,
        dto.building_type ?? null,
        dto.entrances_count ?? null,
        dto.apartments_count ?? null,
        dto.parking_spots ?? null,
        dto.elevator_passenger ?? null,
        dto.elevator_cargo ?? null,
        dto.elevator_cargo_pass ?? null,
        dto.parking_types ?? null,
        dto.has_closed_territory ?? null,
        dto.has_playground ?? null,
        dto.has_sports_ground ?? null,
        dto.finish_type ?? null,
        dto.has_gas ?? null,
        dto.custom_params ? JSON.stringify(dto.custom_params) : null,
        dto.payment_cash_sqm ?? null,
        dto.payment_inst_sqm ?? null,
        dto.payment_inst_months ?? null,
        dto.payment_inst_initial ?? null,
        dto.payment_mort_sqm ?? null,
        dto.payment_mort_rate ?? null,
        dto.payment_mort_months ?? null,
        dto.payment_mort_initial ?? null,
        dto.has_barter ?? null,
        dto.conditions_notes ?? null,
      ],
    );
    return { ...result.rows[0], photos: [], property_count: 0, min_price: null };
  }

  async update(id: string, dto: Partial<CreateComplexDto>) {
    const r = await this.db.query(
      `UPDATE residential_complexes SET
         name                  = COALESCE($1, name),
         developer             = COALESCE($2, developer),
         class                 = COALESCE($3::complex_class, class),
         district              = COALESCE($4, district),
         address               = COALESCE($5, address),
         description           = COALESCE($6, description),
         year_delivery         = COALESCE($7, year_delivery),
         total_floors          = COALESCE($8, total_floors),
         ceiling_height        = COALESCE($9, ceiling_height),
         has_panoramic_windows = COALESCE($10, has_panoramic_windows),
         building_type         = COALESCE($11, building_type),
         entrances_count       = COALESCE($12, entrances_count),
         apartments_count      = COALESCE($13, apartments_count),
         parking_spots         = COALESCE($14, parking_spots),
         elevator_passenger    = COALESCE($15, elevator_passenger),
         elevator_cargo        = COALESCE($16, elevator_cargo),
         elevator_cargo_pass   = COALESCE($17, elevator_cargo_pass),
         parking_types         = COALESCE($18, parking_types),
         has_closed_territory  = COALESCE($19, has_closed_territory),
         has_playground        = COALESCE($20, has_playground),
         has_sports_ground     = COALESCE($21, has_sports_ground),
         finish_type           = COALESCE($22, finish_type),
         has_gas               = COALESCE($23, has_gas),
         custom_params         = COALESCE($24, custom_params),
         payment_cash_sqm      = COALESCE($25, payment_cash_sqm),
         payment_inst_sqm      = COALESCE($26, payment_inst_sqm),
         payment_inst_months   = COALESCE($27, payment_inst_months),
         payment_inst_initial  = COALESCE($28, payment_inst_initial),
         payment_mort_sqm      = COALESCE($29, payment_mort_sqm),
         payment_mort_rate     = COALESCE($30, payment_mort_rate),
         payment_mort_months   = COALESCE($31, payment_mort_months),
         payment_mort_initial  = COALESCE($32, payment_mort_initial),
         has_barter            = COALESCE($33, has_barter),
         conditions_notes      = COALESCE($34, conditions_notes)
       WHERE id = $35 RETURNING *`,
      [
        dto.name ?? null,
        dto.developer ?? null,
        dto.class ?? null,
        dto.district ?? null,
        dto.address ?? null,
        dto.description ?? null,
        dto.year_delivery ?? null,
        dto.total_floors ?? null,
        dto.ceiling_height ?? null,
        dto.has_panoramic_windows ?? null,
        dto.building_type ?? null,
        dto.entrances_count ?? null,
        dto.apartments_count ?? null,
        dto.parking_spots ?? null,
        dto.elevator_passenger ?? null,
        dto.elevator_cargo ?? null,
        dto.elevator_cargo_pass ?? null,
        dto.parking_types ?? null,
        dto.has_closed_territory ?? null,
        dto.has_playground ?? null,
        dto.has_sports_ground ?? null,
        dto.finish_type ?? null,
        dto.has_gas ?? null,
        dto.custom_params ? JSON.stringify(dto.custom_params) : null,
        dto.payment_cash_sqm ?? null,
        dto.payment_inst_sqm ?? null,
        dto.payment_inst_months ?? null,
        dto.payment_inst_initial ?? null,
        dto.payment_mort_sqm ?? null,
        dto.payment_mort_rate ?? null,
        dto.payment_mort_months ?? null,
        dto.payment_mort_initial ?? null,
        dto.has_barter ?? null,
        dto.conditions_notes ?? null,
        id,
      ],
    );
    if (!r.rows[0]) throw new NotFoundException('ЖК не найден');
    return r.rows[0];
  }

  async delete(id: string) {
    await this.db.query('UPDATE residential_complexes SET deleted_at = NOW() WHERE id = $1', [id]);
    return { success: true };
  }

  async listTrashed() {
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const r = await this.db.query(
      `SELECT rc.*,
         (SELECT url FROM complex_photos WHERE complex_id = rc.id AND is_cover = true LIMIT 1) AS cover_url,
         COUNT(p.id) FILTER (WHERE p.deleted_at IS NULL)::int AS property_count
       FROM residential_complexes rc
       LEFT JOIN properties p ON p.complex_id = rc.id
       WHERE rc.deleted_at IS NOT NULL AND rc.deleted_at >= $1
       GROUP BY rc.id ORDER BY rc.deleted_at DESC`,
      [cutoff],
    );
    return r.rows;
  }

  async restore(id: string) {
    const r = await this.db.query(
      'UPDATE residential_complexes SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *',
      [id],
    );
    if (!r.rows[0]) throw new NotFoundException('ЖК не найден в корзине');
    return r.rows[0];
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

  // ── Apartments ────────────────────────────────────────────────────────────────

  async getApartments(complexId: string) {
    const result = await this.db.query(
      `SELECT ca.*,
              json_agg(cap ORDER BY cap.display_order) FILTER (WHERE cap.id IS NOT NULL) AS photos
       FROM complex_apartments ca
       LEFT JOIN complex_apartment_photos cap ON cap.apartment_id = ca.id
       WHERE ca.complex_id = $1
       GROUP BY ca.id
       ORDER BY ca.created_at DESC`,
      [complexId],
    );
    return result.rows;
  }

  async createApartment(complexId: string, dto: CreateApartmentDto) {
    const result = await this.db.query(
      `INSERT INTO complex_apartments
         (complex_id, area, floor, entrance, rooms, window_view, layout_desc, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        complexId,
        dto.area,
        dto.floor ?? null,
        dto.entrance ?? null,
        dto.rooms ?? null,
        dto.window_view ?? null,
        dto.layout_desc ?? null,
        dto.status ?? null,
      ],
    );
    return result.rows[0];
  }

  async updateApartment(id: string, dto: Partial<CreateApartmentDto>) {
    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const updatable = ['area', 'floor', 'entrance', 'rooms', 'window_view', 'layout_desc', 'status'];
    for (const key of updatable) {
      if ((dto as Record<string, unknown>)[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        params.push((dto as Record<string, unknown>)[key]);
      }
    }

    if (!fields.length) {
      const r = await this.db.query('SELECT * FROM complex_apartments WHERE id = $1', [id]);
      return r.rows[0];
    }

    params.push(id);
    const result = await this.db.query(
      `UPDATE complex_apartments SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
    return result.rows[0];
  }

  async deleteApartment(id: string) {
    await this.db.query('DELETE FROM complex_apartments WHERE id = $1', [id]);
    return { success: true };
  }

  // ── Documents ─────────────────────────────────────────────────────────────────

  async getDocuments(complexId: string) {
    const result = await this.db.query(
      `SELECT * FROM complex_documents WHERE complex_id = $1 ORDER BY created_at DESC`,
      [complexId],
    );
    return result.rows;
  }

  async createDocument(complexId: string, url: string, name: string) {
    const result = await this.db.query(
      `INSERT INTO complex_documents (complex_id, url, name) VALUES ($1,$2,$3) RETURNING *`,
      [complexId, url, name],
    );
    return result.rows[0];
  }

  async deleteDocument(id: string) {
    await this.db.query('DELETE FROM complex_documents WHERE id = $1', [id]);
    return { success: true };
  }
}
