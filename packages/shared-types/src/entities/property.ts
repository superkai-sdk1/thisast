export type PropertyType =
  | 'apartment'
  | 'house'
  | 'land'
  | 'commercial'
  | 'new_building'
  | 'resale'
  | 'rent';

export type PropertyStatus = 'active' | 'sold' | 'withdrawn';
export type PropertySubtype = 'secondary' | 'new_building';
export type BuildingStatus = 'delivered' | 'under_construction';
export type VisibilityStatus = 'private' | 'shared' | 'public';

export type PaymentForm =
  | 'cash'
  | 'mortgage'
  | 'installment'
  | 'trade_in'
  | 'matcapital'
  | 'military_mortgage';

export type BathroomType = 'combined' | 'separate' | 'two' | 'three_plus';
export type RoomType = 'isolated' | 'adjacent' | 'studio' | 'free_layout';
export type RenovationType = 'none' | 'rough' | 'cosmetic' | 'euro' | 'clean' | 'designer';

export const RENOVATION_LABELS: Record<RenovationType, string> = {
  none: 'Без ремонта',
  rough: 'Черновая отделка',
  cosmetic: 'Косметический ремонт',
  euro: 'Евроремонт',
  clean: 'Чистовая отделка',
  designer: 'Дизайнерский ремонт',
};

export const BATHROOM_LABELS: Record<BathroomType, string> = {
  combined: 'Совмещённый',
  separate: 'Раздельный',
  two: '2 санузла',
  three_plus: '3+ санузла',
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  isolated: 'Изолированные',
  adjacent: 'Смежные',
  studio: 'Студия',
  free_layout: 'Свободная планировка',
};

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
  display_id: number;
  owner_agent_id: string;
  owner_id: string | null;
  visibility_status: VisibilityStatus;
  property_type: PropertyType;
  status: PropertyStatus;
  listing_type: string; // 'sale' | 'rent'
  // location
  city: string;
  district: string | null;
  street: string | null;
  house_number: string | null;
  apartment_number: string | null;
  region: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  // pricing
  price: number;
  price_per_sqm: number | null;
  net_price: number | null;
  agent_commission: number | null;
  commission_type: string;
  // core specs
  area_sqm: number | null;
  rooms: number | null;
  floor: number | null;
  floor_total: number | null;
  ceiling_height: number | null;
  // apartment-specific
  subtype: PropertySubtype | null;
  building_status: BuildingStatus | null;
  delivery_year: number | null;
  delivery_quarter: number | null;
  kitchen_area: number | null;
  living_area: number | null;
  bathroom_type: BathroomType | null;
  room_type: RoomType | null;
  windows: string[];
  renovation: RenovationType | null;
  warm_floor: boolean;
  furniture: string[];
  has_loggia: boolean;
  has_balcony: boolean;
  has_wardrobe: boolean;
  has_panoramic: boolean;
  // house/land
  plot_area: number | null;
  second_house_area: number | null;
  house_floors: number | null;
  utilities: string[];
  cadastral_number: string | null;
  // other
  from_realtor: boolean;
  conditions: PaymentForm[];
  tags: string[];
  description: string | null;
  complex_id: string | null;
  complex_name?: string | null;
  complex_developer?: string | null;
  mortgage_rate?: number | null;
  mortgage_initial_pct?: number | null;
  installment_plans?: Array<{ months: number; price_sqm: number; initial_pct: number }>;
  created_at_manual: string | null;
  updated_at_manual: string | null;
  photos: PropertyPhoto[];
  match_score?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PropertyFilter {
  search?: string;
  type?: PropertyType | PropertyType[];
  status?: PropertyStatus;
  listing_type?: string;
  district?: string[];
  complex_id?: string;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  rooms?: number[];
  floor_min?: number;
  floor_max?: number;
  renovation?: RenovationType;
  has_loggia?: boolean;
  has_balcony?: boolean;
  has_wardrobe?: boolean;
  has_panoramic?: boolean;
  utilities?: string[];
  from_realtor?: boolean;
  display_id?: number;
  base?: 'own' | 'global' | 'agency';
  page?: number;
  limit?: number;
}
