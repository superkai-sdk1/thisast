export type UserRole = 'superadmin' | 'admin' | 'agent';

export interface UserPermissionFlags {
  can_view_global_database: boolean;
  can_export_data: boolean;
  can_see_financials: boolean;
  can_delete_records: boolean;
}

export interface User {
  id: string;
  agency_id: string | null;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
  permission_flags: UserPermissionFlags;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
