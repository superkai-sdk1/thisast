import { Injectable, Inject } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator.js';
import type { AuditAction } from '../../common/enums/audit-action.enum.js';

export interface AuditLogEntry {
  actor_id: string | null;
  action_type: AuditAction;
  target_type: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(@Inject(DB_POOL) private db: Pool) {}

  async log(entry: AuditLogEntry): Promise<void> {
    await this.db.query(
      `INSERT INTO audit_logs (actor_id, action_type, target_type, target_id, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.actor_id,
        entry.action_type,
        entry.target_type,
        entry.target_id ?? null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.ip_address ?? null,
        entry.user_agent ?? null,
      ],
    );
  }

  async findAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      this.db.query(
        `SELECT al.*, u.full_name AS actor_name, u.email AS actor_email
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.actor_id
         ORDER BY al.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.db.query('SELECT COUNT(*) FROM audit_logs'),
    ]);
    return {
      items: rows.rows,
      total: Number(count.rows[0].count),
      page,
      limit,
    };
  }
}
