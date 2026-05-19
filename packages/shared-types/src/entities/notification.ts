export type NotificationType =
  | 'new_match'
  | 'price_drop_match'
  | 'sharing_request'
  | 'sharing_approved'
  | 'task_due'
  | 'lead_stale';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  sent_at: string | null;
  created_at: string;
}
