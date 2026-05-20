import { apiClient } from './client';

export interface DashboardStats {
  task_completion_pct: number;
  task_total: number;
  task_done: number;
  new_leads_month: number;
  new_leads_week: number;
  active_deals: number;
  closed_deals: number;
  earned_commissions: number;
}

export const analyticsApi = {
  dashboard: () =>
    apiClient.get<DashboardStats>('/analytics/dashboard').then(r => r.data),
  reports: (period = 'month', from?: string, to?: string) =>
    apiClient.get('/analytics/reports', { params: { period, from, to } }).then(r => r.data),
};
