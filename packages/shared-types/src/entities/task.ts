export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'new' | 'in_progress' | 'waiting' | 'done' | 'overdue' | 'cancelled';

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  waiting: 'Ожидание',
  done: 'Выполнена',
  overdue: 'Просрочена',
  cancelled: 'Отменена',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  author_name?: string;
  body: string;
  created_at: string;
}

export interface Task {
  id: string;
  display_id: number;
  agent_id: string;
  assigned_to: string | null;
  assigned_to_name?: string | null;
  title: string;
  description: string | null;
  due_at: string;
  priority: TaskPriority;
  status: TaskStatus;
  // multi-binding
  demand_id: string | null;
  demand_name?: string | null;
  property_id: string | null;
  property_address?: string | null;
  complex_id: string | null;
  complex_name?: string | null;
  deal_id: string | null;
  // legacy
  completed_at: string | null;
  comments?: TaskComment[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  due_at: string;
  priority?: TaskPriority;
  assigned_to?: string;
  demand_id?: string;
  property_id?: string;
  complex_id?: string;
  deal_id?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  demand_id?: string;
  property_id?: string;
  complex_id?: string;
  deal_id?: string;
  due_before?: string;
  due_after?: string;
  page?: number;
  limit?: number;
}
