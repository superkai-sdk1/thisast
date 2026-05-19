import { IsEmail, IsString, IsEnum, IsOptional, IsObject, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  full_name: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  agency_id?: string;

  @IsObject()
  @IsOptional()
  permission_flags?: {
    can_view_global_database?: boolean;
    can_export_data?: boolean;
    can_see_financials?: boolean;
    can_delete_records?: boolean;
  };
}
