import {
  IsString, IsNumber, IsEnum, IsOptional, IsArray,
  IsPositive, IsBoolean, IsDateString,
} from 'class-validator';

export class CreateDemandDto {
  // Core client info
  @IsString()
  buyer_name: string;

  @IsString()
  buyer_phone: string;

  @IsEnum(['buyer', 'seller', 'renter', 'landlord'])
  @IsOptional()
  client_type?: string;

  @IsEnum(['hot', 'warm', 'cold', 'thinking'])
  @IsOptional()
  temperature?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  // Property search criteria (for buyers/renters)
  @IsEnum(['apartment', 'house', 'land', 'commercial', 'new_building', 'rent'])
  @IsOptional()
  property_type?: string;

  @IsEnum(['any', 'new_building', 'secondary'])
  @IsOptional()
  market_type?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  budget_max?: number;

  @IsNumber()
  @IsOptional()
  budget_min?: number;

  // Seller-specific
  @IsNumber()
  @IsOptional()
  net_price?: number;

  // Renter-specific
  @IsNumber()
  @IsOptional()
  rent_price?: number;

  @IsNumber()
  @IsOptional()
  deposit?: number;

  @IsEnum(['not_set', 'included', 'separate'])
  @IsOptional()
  utilities_included?: string;

  // Filters
  @IsArray()
  @IsOptional()
  rooms?: number[];

  @IsArray()
  @IsOptional()
  districts?: string[];

  @IsArray()
  @IsOptional()
  repair_types?: string[];

  @IsArray()
  @IsOptional()
  payment_forms?: string[];

  @IsNumber()
  @IsOptional()
  area_min?: number;

  @IsNumber()
  @IsOptional()
  area_max?: number;

  @IsNumber()
  @IsOptional()
  floor_min?: number;

  @IsNumber()
  @IsOptional()
  floor_max?: number;

  // Contact tracking
  @IsDateString()
  @IsOptional()
  first_contact_at?: string;

  @IsDateString()
  @IsOptional()
  last_contact_at?: string;

  @IsDateString()
  @IsOptional()
  next_contact_at?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  demand_notes?: string;
}
