import { apiClient } from './client';
import type { Demand } from '@crm/shared-types';

export interface DemandFilter {
  kanban_status?: string;
  property_type?: string;
  districts?: string[];
  repair_types?: string[];
  payment_forms?: string[];
  budget_max?: number;
  q?: string;
}

export const demandsApi = {
  list: (filter?: DemandFilter) =>
    apiClient.get<{ data: Demand[] }>('/demands', { params: filter }).then(r => r.data.data),

  detail: (id: string) =>
    apiClient.get<{ data: Demand }>(`/demands/${id}`).then(r => r.data.data),

  create: (data: Partial<Demand>) =>
    apiClient.post<{ data: Demand }>('/demands', data).then(r => r.data.data),

  update: (id: string, data: Partial<Demand>) =>
    apiClient.patch<{ data: Demand }>(`/demands/${id}`, data).then(r => r.data.data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/demands/${id}/kanban-status`, { status }),

  delete: (id: string) => apiClient.delete(`/demands/${id}`),

  getMatches: (id: string) =>
    apiClient.get<{ data: unknown[] }>(`/demands/${id}/matches`).then(r => r.data.data),

  getActivity: (id: string) =>
    apiClient.get<{ data: unknown[] }>(`/demands/${id}/activity`).then(r => r.data.data),

  addActivity: (id: string, type: string, body: string) =>
    apiClient.post(`/demands/${id}/activity`, { type, body }),
};
