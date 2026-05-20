import { apiClient } from './client';

export interface Task {
  id: string;
  display_id: number;
  agent_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  due_at: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'waiting' | 'done' | 'overdue' | 'cancelled';
  demand_id: string | null;
  property_id: string | null;
  complex_id: string | null;
  deal_id: string | null;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name?: string;
}

export interface TaskFilter {
  status?: string;
  priority?: string;
  due_before?: string;
  entity_type?: string;
  entity_id?: string;
  page?: number;
  limit?: number;
}

export const tasksApi = {
  list: (filter?: TaskFilter) =>
    apiClient.get<Task[]>('/tasks', { params: filter }).then(r => r.data),
  detail: (id: string) =>
    apiClient.get<Task>(`/tasks/${id}`).then(r => r.data),
  create: (data: Partial<Task>) =>
    apiClient.post<Task>('/tasks', data).then(r => r.data),
  update: (id: string, data: Partial<Task>) =>
    apiClient.patch<Task>(`/tasks/${id}`, data).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
  getComments: (id: string) =>
    apiClient.get<TaskComment[]>(`/tasks/${id}/comments`).then(r => r.data),
  addComment: (id: string, body: string) =>
    apiClient.post<TaskComment>(`/tasks/${id}/comments`, { body }).then(r => r.data),
};
