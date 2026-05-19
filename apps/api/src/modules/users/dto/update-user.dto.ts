import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdatePermissionsDto {
  @IsObject()
  permission_flags: {
    can_view_global_database: boolean;
    can_export_data: boolean;
    can_see_financials: boolean;
    can_delete_records: boolean;
  };
}
