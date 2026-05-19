import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditAction } from '../../common/enums/audit-action.enum.js';
import type { JwtPayload } from '../../common/types/jwt-payload.type.js';

export class CreateOwnerDto {
  full_name: string;
  phone: string;
  email?: string;
  notes?: string;
}

@Injectable()
export class OwnersService {
  constructor(
    @Inject(DB_POOL) private db: Pool,
    private auditLog: AuditLogService,
  ) {}

  async findAll(actor: JwtPayload) {
    const result = await this.db.query(
      `SELECT * FROM owners WHERE created_by = $1 ORDER BY full_name`,
      [actor.sub],
    );
    return result.rows;
  }

  async findOne(id: string, actor: JwtPayload, ip?: string, userAgent?: string) {
    const result = await this.db.query('SELECT * FROM owners WHERE id = $1', [id]);
    if (!result.rows[0]) throw new NotFoundException('Собственник не найден');

    // Audit log every read of owner contact data
    await this.auditLog.log({
      actor_id: actor.sub,
      action_type: AuditAction.VIEW_CONTACT,
      target_type: 'owner',
      target_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return result.rows[0];
  }

  async create(dto: CreateOwnerDto, actor: JwtPayload) {
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
}
