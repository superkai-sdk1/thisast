import { apiClient } from './client';
import type { ResidentialComplex } from '@crm/shared-types';

export interface ComplexFilter {
  q?: string;
  district?: string;
  class?: string;
  year_delivery?: number;
}

export const complexesApi = {
  list: (filter?: ComplexFilter) =>
    apiClient
      .get<{ data: ResidentialComplex[] }>('/complexes', { params: filter })
      .then(r => r.data.data),

  detail: (id: string) =>
    apiClient.get<{ data: ResidentialComplex }>(`/complexes/${id}`).then(r => r.data.data),

  create: (data: Partial<ResidentialComplex>) =>
    apiClient.post<{ data: ResidentialComplex }>('/complexes', data).then(r => r.data.data),

  update: (id: string, data: Partial<ResidentialComplex>) =>
    apiClient.patch<{ data: ResidentialComplex }>(`/complexes/${id}`, data).then(r => r.data.data),

  delete: (id: string) =>
    apiClient.delete(`/complexes/${id}`),

  uploadPhoto: (id: string, file: File, isCover = false) => {
    const form = new FormData();
    form.append('file', file);
    form.append('is_cover', String(isCover));
    return apiClient
      .post<{ data: { id: string; url: string; is_cover: boolean } }>(`/complexes/${id}/photos`, form)
      .then(r => r.data.data);
  },

  deletePhoto: (photoId: string) =>
    apiClient.delete(`/complexes/photos/${photoId}`),
};
