import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Pool } from 'pg';
import { InjectDb } from '@crm/shared-core';
import type { JwtPayload } from '@crm/shared-core';

interface SplitDto {
  partner_name: string;
  split_amount: number;
  split_percent?: number | null;
}

interface CreateDealDto {
  demand_id?: string;
  property_id?: string;
  is_external_property?: boolean;
  external_address?: string;
  buyer_owner_id?: string;
  seller_owner_id?: string;
  deal_price: number;
  my_commission?: number;
  payment_form?: string;
  notes?: string;
  commission_splits?: SplitDto[];
}

const Role = {
  AGENT: 'agent',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

@Injectable()
export class DealsService {
  constructor(@InjectDb() private db: Pool) {}

  async findAll(actor: JwtPayload) {
    const isAdmin = ([Role.ADMIN, Role.SUPERADMIN] as string[]).includes(actor.role);
    const result = await this.db.query(
      `SELECT d.*,
              json_agg(cs) FILTER (WHERE cs.id IS NOT NULL) AS commission_splits
       FROM deals d
       LEFT JOIN commission_splits cs ON cs.deal_id = d.id
       WHERE ($1::boolean OR d.created_by = $2)
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [isAdmin, actor.sub],
    );
    return result.rows;
  }

  async findOne(id: string, actor: JwtPayload) {
    const result = await this.db.query(
      `SELECT d.*,
              json_agg(cs) FILTER (WHERE cs.id IS NOT NULL) AS commission_splits
       FROM deals d
       LEFT JOIN commission_splits cs ON cs.deal_id = d.id
       WHERE d.id = $1
       GROUP BY d.id`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Сделка не найдена');
    const deal = result.rows[0];
    if (deal.created_by !== actor.sub && actor.role === Role.AGENT) {
      throw new ForbiddenException('Нет доступа к этой сделке');
    }
    return deal;
  }

  async create(dto: CreateDealDto, actor: JwtPayload) {
    const result = await this.db.query(
      `INSERT INTO deals (
         demand_id, property_id, is_external_property, external_address,
         buyer_owner_id, seller_owner_id, deal_price, my_commission,
         payment_form, status, created_by, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'in_progress',$10,$11)
       RETURNING *`,
      [
        dto.demand_id ?? null,
        dto.property_id ?? null,
        dto.is_external_property ?? false,
        dto.external_address ?? null,
        dto.buyer_owner_id ?? null,
        dto.seller_owner_id ?? null,
        dto.deal_price,
        dto.my_commission ?? null,
        dto.payment_form ?? null,
        actor.sub,
        dto.notes ?? null,
      ],
    );
    const deal = result.rows[0];

    if (dto.commission_splits?.length) {
      for (const s of dto.commission_splits) {
        if (!s.partner_name || !s.split_amount) continue;
        await this.db.query(
          `INSERT INTO commission_splits (deal_id, partner_name, split_amount, split_percent)
           VALUES ($1, $2, $3, $4)`,
          [deal.id, s.partner_name, s.split_amount, s.split_percent ?? null],
        );
      }
    }

    return deal;
  }

  async update(id: string, dto: Record<string, unknown>, actor: JwtPayload) {
    await this.findOne(id, actor);
    const result = await this.db.query(
      `UPDATE deals SET
         deal_price    = COALESCE($1, deal_price),
         my_commission = COALESCE($2, my_commission),
         notes         = COALESCE($3, notes),
         status        = COALESCE($4, status),
         closed_at     = CASE WHEN $4 = 'closed' THEN NOW() ELSE closed_at END
       WHERE id = $5 RETURNING *`,
      [
        dto['deal_price'] ?? null,
        dto['my_commission'] ?? null,
        dto['notes'] ?? null,
        dto['status'] ?? null,
        id,
      ],
    );
    return result.rows[0];
  }

  async delete(id: string, actor: JwtPayload) {
    await this.findOne(id, actor);
    await this.db.query('DELETE FROM deals WHERE id = $1', [id]);
    return { success: true };
  }

  async getSummary(actor: JwtPayload) {
    const result = await this.db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
         COUNT(*) FILTER (WHERE status = 'closed') AS closed_count,
         COALESCE(SUM(deal_price) FILTER (WHERE status = 'closed'), 0) AS total_gross,
         COALESCE(SUM(my_commission) FILTER (WHERE status = 'closed'), 0) -
         COALESCE((
           SELECT SUM(cs.split_amount) FROM commission_splits cs
           JOIN deals d2 ON d2.id = cs.deal_id
           WHERE d2.created_by = $1 AND d2.status = 'closed'
         ), 0) AS total_net,
         COUNT(*) AS deals_count
       FROM deals WHERE created_by = $1`,
      [actor.sub],
    );
    return result.rows[0];
  }
}
