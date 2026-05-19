import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDb } from '@crm/shared-core';
import type { Pool } from 'pg';

export interface CreateOwnerDto {
  full_name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface ActorPayload {
  sub: string;
  role: string;
}

@Injectable()
export class OwnersService {
  constructor(@InjectDb() private db: Pool) {}

  async findAll(actor: ActorPayload) {
    const result = await this.db.query(
      `SELECT * FROM owners WHERE created_by = $1 ORDER BY full_name`,
      [actor.sub],
    );
    return result.rows;
  }

  async findOne(id: string) {
    const result = await this.db.query('SELECT * FROM owners WHERE id = $1', [id]);
    if (!result.rows[0]) throw new NotFoundException('Собственник не найден');
    return result.rows[0];
  }

  async create(dto: CreateOwnerDto, actor: ActorPayload) {
    const result = await this.db.query(
      `INSERT INTO owners (full_name, phone, email, notes, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dto.full_name, dto.phone, dto.email ?? null, dto.notes ?? null, actor.sub],
    );
    return result.rows[0];
  }

  async update(id: string, dto: Partial<CreateOwnerDto>) {
    const result = await this.db.query(
      `UPDATE owners SET
         full_name = COALESCE($1, full_name),
         phone     = COALESCE($2, phone),
         email     = COALESCE($3, email),
         notes     = COALESCE($4, notes)
       WHERE id = $5 RETURNING *`,
      [dto.full_name ?? null, dto.phone ?? null, dto.email ?? null, dto.notes ?? null, id],
    );
    if (!result.rows[0]) throw new NotFoundException('Собственник не найден');
    return result.rows[0];
  }

  async delete(id: string) {
    const result = await this.db.query('DELETE FROM owners WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) throw new NotFoundException('Собственник не найден');
    return { success: true };
  }
}
