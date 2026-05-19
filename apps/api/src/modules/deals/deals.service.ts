import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { Role } from '../../common/enums/role.enum';

export class CreateDealDto {
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
}

export class CreateSplitDto {
  partner_name: string;
  partner_agent_id?: string;
  split_amount: number;
  split_percent?: number;
  notes?: string;
}

@Injectable()
export class DealsService {
  constructor(@Inject(DB_POOL) private db: Pool) {}

  async findAll(actor: JwtPayload) {
    const isAdmin = [Role.ADMIN, Role.SUPERADMIN].includes(actor.role as Role);
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
    return result.rows[0];
  }

  async update(id: string, dto: Partial<CreateDealDto>, actor: JwtPayload) {
    await this.findOne(id, actor);
    const result = await this.db.query(
      `UPDATE deals SET
         deal_price    = COALESCE($1, deal_price),
         my_commission = COALESCE($2, my_commission),
         notes         = COALESCE($3, notes),
         status        = COALESCE($4, status),
         closed_at     = CASE WHEN $4 = 'closed' THEN NOW() ELSE closed_at END
       WHERE id = $5 RETURNING *`,
      [dto.deal_price ?? null, dto.my_commission ?? null, dto.notes ?? null, (dto as Record<string, unknown>)['status'] ?? null, id],
    );
    return result.rows[0];
  }

  async getSplits(dealId: string, actor: JwtPayload) {
    await this.findOne(dealId, actor);
    const result = await this.db.query(
      'SELECT * FROM commission_splits WHERE deal_id = $1 ORDER BY created_at',
      [dealId],
    );
    return result.rows;
  }

  async addSplit(dealId: string, dto: CreateSplitDto, actor: JwtPayload) {
    await this.findOne(dealId, actor);
    const result = await this.db.query(
      `INSERT INTO commission_splits (deal_id, partner_name, partner_agent_id, split_amount, split_percent, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [dealId, dto.partner_name, dto.partner_agent_id ?? null, dto.split_amount, dto.split_percent ?? null, dto.notes ?? null],
    );
    return result.rows[0];
  }

  async deleteSplit(dealId: string, splitId: string, actor: JwtPayload) {
    await this.findOne(dealId, actor);
    await this.db.query('DELETE FROM commission_splits WHERE id = $1 AND deal_id = $2', [splitId, dealId]);
    return { success: true };
  }

  async getSummary(actor: JwtPayload) {
    const result = await this.db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
         COUNT(*) FILTER (WHERE status = 'closed') AS closed_count,
         COALESCE(SUM(my_commission) FILTER (WHERE status = 'closed'), 0) AS gross_commission,
         COALESCE(SUM(my_commission) FILTER (WHERE status = 'closed'), 0) -
         COALESCE((
           SELECT SUM(cs.split_amount) FROM commission_splits cs
           JOIN deals d2 ON d2.id = cs.deal_id
           WHERE d2.created_by = $1 AND d2.status = 'closed'
         ), 0) AS net_commission
       FROM deals WHERE created_by = $1`,
      [actor.sub],
    );
    return result.rows[0];
  }
}
