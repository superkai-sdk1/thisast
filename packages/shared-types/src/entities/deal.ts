import type { PaymentForm } from './property.js';

export type DealStatus = 'in_progress' | 'closed';

export interface CommissionSplit {
  id: string;
  deal_id: string;
  partner_name: string;
  partner_agent_id: string | null;
  split_amount: number;
  split_percent: number | null;
  notes: string | null;
  created_at: string;
}

export interface Deal {
  id: string;
  demand_id: string | null;
  property_id: string | null;
  is_external_property: boolean;
  external_address: string | null;
  buyer_owner_id: string | null;
  seller_owner_id: string | null;
  deal_price: number;
  my_commission: number | null;
  payment_form: PaymentForm | null;
  status: DealStatus;
  created_by: string;
  notes: string | null;
  closed_at: string | null;
  commission_splits?: CommissionSplit[];
  created_at: string;
  updated_at: string;
}
