import { apiClient } from './client';
import type { Demand } from '@crm/shared-types';

export interface DemandFilter {
  kanban_status?: string;
  client_type?: string;
  temperature?: string;
  is_active?: string | boolean;
  property_type?: string;
  districts?: string[];
  repair_types?: string[];
  payment_forms?: string[];
  budget_max?: number;
  q?: string;
  page?: number;
  limit?: number;
}

export const demandsApi = {
  list: (filter?: DemandFilter) =>
    apiClient.get<Demand[] | { data: Demand[] }>('/demands', { params: filter }).then(r =>
      Array.isArray(r.data) ? r.data : (r.data as { data: Demand[] }).data ?? []
    ),

  detail: (id: string) =>
    apiClient.get<Demand | { data: Demand }>(`/demands/${id}`).then(r =>
      (r.data as { data: Demand }).data ?? r.data as Demand
    ),

  create: (data: Partial<Demand> | Record<string, unknown>) =>
    apiClient.post<Demand | { data: Demand }>('/demands', data).then(r =>
      (r.data as { data: Demand }).data ?? r.data as Demand
    ),

  update: (id: string, data: Partial<Demand> | Record<string, unknown>) =>
    apiClient.patch<Demand | { data: Demand }>(`/demands/${id}`, data).then(r =>
      (r.data as { data: Demand }).data ?? r.data as Demand
    ),

  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/demands/${id}/kanban-status`, { status }),

  delete: (id: string) => apiClient.delete(`/demands/${id}`),

  getMatches: (id: string) =>
    apiClient.get<unknown[] | { data: unknown[] }>(`/demands/${id}/matches`).then(r =>
      Array.isArray(r.data) ? r.data : (r.data as { data: unknown[] }).data ?? []
    ),

  getActivity: (id: string) =>
    apiClient.get<unknown[] | { data: unknown[] }>(`/demands/${id}/activity`).then(r =>
      Array.isArray(r.data) ? r.data : (r.data as { data: unknown[] }).data ?? []
    ),

  addActivity: (id: string, type: string, body: string) =>
    apiClient.post(`/demands/${id}/activity`, { type, body }),

  getEvents: (id: string) =>
    apiClient.get<unknown[] | { data: unknown[] }>(`/demands/${id}/events`).then(r =>
      Array.isArray(r.data) ? r.data : (r.data as { data: unknown[] }).data ?? []
    ),
};
