import {
  IsString, IsEnum, IsNumber, IsOptional, IsArray,
  IsPositive, IsUUID, Min, Max,
} from 'class-validator';

export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial' | 'new_building' | 'rent';
export type VisibilityStatus = 'private' | 'shared' | 'public';
export type PaymentForm = 'cash' | 'mortgage' | 'installment' | 'trade_in' | 'matcapital' | 'military_mortgage';

export class CreatePropertyDto {
  @IsEnum(['apartment', 'house', 'land', 'commercial', 'new_building', 'rent'])
  property_type: PropertyType;

  @IsEnum(['private', 'shared', 'public'])
  @IsOptional()
  visibility_status?: VisibilityStatus;

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

  @IsNumber()
  @IsPositive()
  price: number;

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
}
