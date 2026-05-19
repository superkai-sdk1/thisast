import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsPositive } from 'class-validator';

export class CreateDemandDto {
  @IsString()
  buyer_name: string;

  @IsString()
  buyer_phone: string;

  @IsNumber()
  @IsPositive()
  budget_max: number;

  @IsNumber()
  @IsOptional()
  budget_min?: number;

  @IsEnum(['apartment', 'house', 'land', 'commercial', 'new_building', 'rent'])
  property_type: string;

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

  @IsString()
  @IsOptional()
  notes?: string;
}
