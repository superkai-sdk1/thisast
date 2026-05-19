import { apiClient } from './client';
import type { Deal } from '@crm/shared-types';

export const dealsApi = {
  summary: () =>
    apiClient.get<{ data: { in_progress_count: number; closed_count: number; gross_commission: number; net_commission: number } }>('/deals/summary').then(r => r.data.data),

  list: () =>
    apiClient.get<{ data: Deal[] }>('/deals').then(r => r.data.data),

  detail: (id: string) =>
    apiClient.get<{ data: Deal }>(`/deals/${id}`).then(r => r.data.data),

  create: (data: Partial<Deal>) =>
    apiClient.post<{ data: Deal }>('/deals', data).then(r => r.data.data),

  update: (id: string, data: Partial<Deal>) =>
    apiClient.patch<{ data: Deal }>(`/deals/${id}`, data).then(r => r.data.data),
};
