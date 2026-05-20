import {
  IsString, IsEnum, IsNumber, IsOptional, IsArray,
  IsPositive, IsUUID, Min, Max, IsBoolean, IsDateString,
} from 'class-validator';

export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial' | 'new_building' | 'resale' | 'rent';
export type VisibilityStatus = 'private' | 'shared' | 'public';
export type PaymentForm = 'cash' | 'mortgage' | 'installment' | 'trade_in' | 'matcapital' | 'military_mortgage';
export type PropertyStatus = 'active' | 'sold' | 'withdrawn';
export type PropertySubtype = 'secondary' | 'new_building';
export type BuildingStatus = 'delivered' | 'under_construction';
export type BathroomType = 'combined' | 'separate' | 'two' | 'three_plus';
export type RoomType = 'isolated' | 'adjacent' | 'studio' | 'free_layout';
export type RenovationType = 'none' | 'rough' | 'cosmetic' | 'euro' | 'clean' | 'designer';

export class CreatePropertyDto {
  @IsEnum(['apartment', 'house', 'land', 'commercial', 'new_building', 'resale', 'rent'])
  property_type: PropertyType;

  @IsEnum(['private', 'shared', 'public'])
  @IsOptional()
  visibility_status?: VisibilityStatus;

  @IsEnum(['active', 'sold', 'withdrawn'])
  @IsOptional()
  status?: PropertyStatus;

  @IsEnum(['sale', 'rent'])
  @IsOptional()
  listing_type?: string;

  // Location
  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  house_number?: string;

  @IsString()
  @IsOptional()
  apartment_number?: string;

  // Pricing
  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsOptional()
  net_price?: number;

  @IsNumber()
  @IsOptional()
  agent_commission?: number;

  @IsEnum(['fixed', 'percent'])
  @IsOptional()
  commission_type?: string;

  // Core specs
  @IsNumber()
  @IsOptional()
  area_sqm?: number;

  @IsNumber()
  @IsOptional()
  @Min(0) @Max(10)
  rooms?: number;

  @IsNumber()
  @IsOptional()
  floor?: number;

  @IsNumber()
  @IsOptional()
  floor_total?: number;

  @IsNumber()
  @IsOptional()
  ceiling_height?: number;

  // Apartment-specific
  @IsEnum(['secondary', 'new_building'])
  @IsOptional()
  subtype?: PropertySubtype;

  @IsEnum(['delivered', 'under_construction'])
  @IsOptional()
  building_status?: BuildingStatus;

  @IsNumber()
  @IsOptional()
  @Min(2000) @Max(2050)
  delivery_year?: number;

  @IsNumber()
  @IsOptional()
  @Min(1) @Max(4)
  delivery_quarter?: number;

  @IsNumber()
  @IsOptional()
  kitchen_area?: number;

  @IsNumber()
  @IsOptional()
  living_area?: number;

  @IsEnum(['combined', 'separate', 'two', 'three_plus'])
  @IsOptional()
  bathroom_type?: BathroomType;

  @IsEnum(['isolated', 'adjacent', 'studio', 'free_layout'])
  @IsOptional()
  room_type?: RoomType;

  @IsArray()
  @IsOptional()
  windows?: string[];

  @IsEnum(['none', 'rough', 'cosmetic', 'euro', 'clean', 'designer'])
  @IsOptional()
  renovation?: RenovationType;

  @IsBoolean()
  @IsOptional()
  warm_floor?: boolean;

  @IsArray()
  @IsOptional()
  furniture?: string[];

  @IsBoolean()
  @IsOptional()
  has_loggia?: boolean;

  @IsBoolean()
  @IsOptional()
  has_balcony?: boolean;

  @IsBoolean()
  @IsOptional()
  has_wardrobe?: boolean;

  @IsBoolean()
  @IsOptional()
  has_panoramic?: boolean;

  // House/land
  @IsNumber()
  @IsOptional()
  plot_area?: number;

  @IsNumber()
  @IsOptional()
  second_house_area?: number;

  @IsNumber()
  @IsOptional()
  house_floors?: number;

  @IsArray()
  @IsOptional()
  utilities?: string[];

  @IsString()
  @IsOptional()
  cadastral_number?: string;

  // Other
  @IsBoolean()
  @IsOptional()
  from_realtor?: boolean;

  @IsArray()
  @IsOptional()
  conditions?: PaymentForm[];

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  owner_id?: string;

  @IsUUID()
  @IsOptional()
  complex_id?: string;

  @IsDateString()
  @IsOptional()
  created_at_manual?: string;

  @IsDateString()
  @IsOptional()
  updated_at_manual?: string;
}
