import { apiClient } from './client';
import type { Property } from '@crm/shared-types';
import type { PaginatedResponse } from '@crm/shared-types';

export interface PropertyFilter {
  type?: string;
  status?: 'private' | 'shared' | 'public';
  listing_type?: 'sale' | 'rent';
  property_status?: 'active' | 'sold' | 'withdrawn';
  renovation?: string;
  has_loggia?: boolean;
  has_balcony?: boolean;
  has_wardrobe?: boolean;
  has_panoramic?: boolean;
  from_realtor?: boolean;
  base?: 'own' | 'global' | 'agency';
  price_min?: number;
  price_max?: number;
  district?: string;
  rooms?: number[];
  area_min?: number;
  area_max?: number;
  floor_min?: number;
  floor_max?: number;
  tags?: string[];
  is_mine?: boolean;
  q?: string;
  owner_search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  payment_form?: string;
  complex_id?: string;
}

export const propertiesApi = {
  list: (filter: PropertyFilter) =>
    apiClient.get<{ data: PaginatedResponse<Property> }>('/properties', { params: filter })
      .then(r => r.data.data),

  detail: (id: string) =>
    apiClient.get<{ data: Property }>(`/properties/${id}`).then(r => r.data.data),

  create: (data: Partial<Property>) =>
    apiClient.post<{ data: Property }>('/properties', data).then(r => r.data.data),

  update: (id: string, data: Partial<Property>) =>
    apiClient.patch<{ data: Property }>(`/properties/${id}`, data).then(r => r.data.data),

  updateVisibility: (id: string, visibility: string) =>
    apiClient.patch(`/properties/${id}/visibility`, { visibility }),

  delete: (id: string) => apiClient.delete(`/properties/${id}`),

  getMatches: (id: string) =>
    apiClient.get<{ data: unknown[] }>(`/properties/${id}/matches`).then(r => r.data.data),

  downloadPdf: (id: string) =>
    apiClient.get(`/properties/${id}/pdf`, { responseType: 'blob' }),

  uploadPhotos: (id: string, files: File[]) => {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    return apiClient.post<{ data: unknown[] }>(`/properties/${id}/photos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data);
  },

  deletePhoto: (propertyId: string, photoId: string) =>
    apiClient.delete(`/properties/${propertyId}/photos/${photoId}`),

  reorderPhotos: (propertyId: string, order: { id: string; display_order: number }[]) =>
    apiClient.patch(`/properties/${propertyId}/photos/reorder`, { order }),

  getEvents: (id: string) =>
    apiClient.get<{ data: unknown[] }>(`/properties/${id}/events`).then(r => r.data.data ?? []),
};
