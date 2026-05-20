import { apiClient } from './client';
import type { Deal } from '@crm/shared-types';

export const dealsApi = {
  summary: () =>
    apiClient
      .get<{ data: Record<string, string | number> }>('/deals/summary')
      .then(r => {
        const d = r.data.data;
        return {
          gross_commission:  Number(d['total_gross']       ?? d['gross_commission'] ?? 0),
          net_commission:    Number(d['total_net']         ?? d['net_commission']   ?? 0),
          closed_count:      Number(d['closed_count']      ?? 0),
          in_progress_count: Number(d['in_progress_count'] ?? 0),
        };
      }),

  list: () =>
    apiClient.get<{ data: Deal[] }>('/deals').then(r => r.data.data),

  detail: (id: string) =>
    apiClient.get<{ data: Deal }>(`/deals/${id}`).then(r => r.data.data),

  create: (data: Partial<Deal>) =>
    apiClient.post<{ data: Deal }>('/deals', data).then(r => r.data.data),

  update: (id: string, data: Partial<Deal>) =>
    apiClient.patch<{ data: Deal }>(`/deals/${id}`, data).then(r => r.data.data),
};
