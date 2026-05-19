import { apiClient } from './client';
import type { User } from '@crm/shared-types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ data: { access_token: string; refresh_token: string; user: User } }>('/auth/login', { email, password })
      .then(r => r.data.data),

  refresh: (refresh_token: string) =>
    apiClient.post<{ data: { access_token: string; refresh_token: string } }>('/auth/refresh', { refresh_token })
      .then(r => r.data.data),

  logout: (refresh_token: string) =>
    apiClient.post('/auth/logout', { refresh_token }),

  me: () =>
    apiClient.get<{ data: User }>('/auth/me').then(r => r.data.data),
};
