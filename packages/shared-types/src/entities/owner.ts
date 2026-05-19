export interface Owner {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
