import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, MinLength, MaxLength } from 'class-validator';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus   = 'new' | 'in_progress' | 'waiting' | 'done' | 'overdue' | 'cancelled';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  due_at: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsUUID()
  demand_id?: string;

  @IsOptional()
  @IsUUID()
  property_id?: string;

  @IsOptional()
  @IsUUID()
  complex_id?: string;

  @IsOptional()
  @IsUUID()
  deal_id?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  due_at?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(['new', 'in_progress', 'waiting', 'done', 'overdue', 'cancelled'])
  status?: TaskStatus;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsUUID()
  demand_id?: string;

  @IsOptional()
  @IsUUID()
  property_id?: string;

  @IsOptional()
  @IsUUID()
  complex_id?: string;

  @IsOptional()
  @IsUUID()
  deal_id?: string;
}

export class AddCommentDto {
  @IsString()
  @MinLength(1)
  body: string;
}
