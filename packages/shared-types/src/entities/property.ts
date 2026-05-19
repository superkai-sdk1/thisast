export type PropertyType =
  | 'apartment'
  | 'house'
  | 'land'
  | 'commercial'
  | 'new_building'
  | 'resale'
  | 'rent';

export type VisibilityStatus = 'private' | 'shared' | 'public';

export type PaymentForm =
  | 'cash'
  | 'mortgage'
  | 'installment'
  | 'trade_in'
  | 'matcapital'
  | 'military_mortgage';

export interface PropertyPhoto {
  id: string;
  property_id: string;
  url: string;
  display_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface Property {
  id: string;
  owner_agent_id: string;
  owner_id: string | null;
  visibility_status: VisibilityStatus;
  property_type: PropertyType;
  city: string;
  district: string | null;
  street: string | null;
  house_number: string | null;
  apartment_number: string | null;
  region: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number;
  price_per_sqm: number | null;
  area_sqm: number | null;
  rooms: number | null;
  floor: number | null;
  floor_total: number | null;
  ceiling_height: number | null;
  conditions: PaymentForm[];
  tags: string[];
  description: string | null;
  photos: PropertyPhoto[];
  match_score?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
