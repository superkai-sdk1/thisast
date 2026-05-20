export type ComplexClass = 'economy' | 'comfort' | 'business' | 'premium';

export interface ComplexPhoto {
  id: string;
  complex_id: string;
  url: string;
  display_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface ResidentialComplex {
  id: string;
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
  photos: ComplexPhoto[];
  property_count?: number;
  min_price?: number | null;
  created_at: string;
  updated_at: string;
}
