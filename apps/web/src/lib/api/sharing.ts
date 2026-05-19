import { apiClient } from './client';

export interface SharingRequest {
  id: string;
  property_id: string;
  requester_id: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
}

export const sharingApi = {
  request: (propertyId: string) =>
    apiClient.post<{ data: SharingRequest }>('/sharing/request', { property_id: propertyId }).then(r => r.data.data),

  approve: (id: string) =>
    apiClient.patch(`/sharing/${id}/approve`),

  deny: (id: string) =>
    apiClient.patch(`/sharing/${id}/deny`),

  listPending: () =>
    apiClient.get<{ data: SharingRequest[] }>('/sharing/pending').then(r => r.data.data),
};
