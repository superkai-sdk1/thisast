export type ComplexClass = 'economy' | 'comfort' | 'business' | 'premium';
export type BuildingType = 'monolith_brick' | 'monolith_block' | 'panel';
export type ComplexFinish = 'none' | 'rough' | 'clean' | 'turnkey';
export type ApartmentStatus = 'free' | 'reserved' | 'sold';

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  monolith_brick: 'Монолитно-кирпичный',
  monolith_block: 'Монолитно-блочный',
  panel: 'Панельный',
};

export const COMPLEX_FINISH_LABELS: Record<ComplexFinish, string> = {
  none: 'Без отделки',
  rough: 'Черновая',
  clean: 'Чистовая',
  turnkey: 'Ремонт под ключ',
};

export const APARTMENT_STATUS_LABELS: Record<ApartmentStatus, string> = {
  free: 'Свободна',
  reserved: 'Забронирована',
  sold: 'Продана',
};

export interface ComplexPhoto {
  id: string;
  complex_id: string;
  url: string;
  display_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface ComplexDocument {
  id: string;
  complex_id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface ApartmentPhoto {
  id: string;
  apartment_id: string;
  url: string;
  display_order: number;
  created_at: string;
}

export interface ComplexApartment {
  id: string;
  complex_id: string;
  display_id: number;
  area: number;
  floor: number | null;
  entrance: number | null;
  rooms: number | null; // 0=studio
  window_view: string | null;
  layout_desc: string | null;
  status: ApartmentStatus;
  photos?: ApartmentPhoto[];
  created_at: string;
  updated_at: string;
}

export interface CustomParam {
  name: string;
  value: string;
}

export interface ResidentialComplex {
  id: string;
  display_id: number;
  name: string;
  developer: string | null;
  class: ComplexClass | null;
  district: string | null;
  address: string | null;
  description: string | null;
  year_delivery: number | null;
  total_floors: number | null;
  is_active: boolean;
  created_by: string | null;
  // building characteristics
  ceiling_height: number | null;
  has_panoramic_windows: boolean;
  building_type: BuildingType | null;
  // counts
  entrances_count: number | null;
  apartments_count: number | null;
  parking_spots: number | null;
  // elevators
  elevator_passenger: number | null;
  elevator_cargo: number | null;
  elevator_cargo_pass: number | null;
  // parking & yard
  parking_types: string[];
  has_closed_territory: boolean;
  has_playground: boolean;
  has_sports_ground: boolean;
  // finishes & utilities
  finish_type: ComplexFinish | null;
  has_gas: boolean;
  // custom params
  custom_params: CustomParam[];
  // payment forms
  payment_cash_sqm: number | null;
  payment_inst_sqm: number | null;
  payment_inst_months: number | null;
  payment_inst_initial: number | null;
  payment_mort_sqm: number | null;
  payment_mort_rate: number | null;
  payment_mort_months: number | null;
  payment_mort_initial: number | null;
  has_barter: boolean;
  conditions_notes: string[];
  // relations
  photos: ComplexPhoto[];
  property_count?: number;
  min_price?: number | null;
  created_at: string;
  updated_at: string;
}
