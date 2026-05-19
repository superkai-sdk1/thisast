import { SetMetadata } from '@nestjs/common';

export type PermissionFlag =
  | 'can_view_global_database'
  | 'can_export_data'
  | 'can_see_financials'
  | 'can_delete_records';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (...flags: PermissionFlag[]) =>
  SetMetadata(PERMISSIONS_KEY, flags);
