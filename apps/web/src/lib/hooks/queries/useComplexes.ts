'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complexesApi, type ComplexFilter } from '../../api/complexes';
import type { ResidentialComplex } from '@crm/shared-types';

export const complexKeys = {
  all:    () => ['complexes'] as const,
  list:   (f?: ComplexFilter) => [...complexKeys.all(), 'list', f] as const,
  detail: (id: string) => [...complexKeys.all(), 'detail', id] as const,
};

export function useComplexes(filter?: ComplexFilter) {
  return useQuery({
    queryKey: complexKeys.list(filter),
    queryFn: () => complexesApi.list(filter),
    staleTime: 60 * 1000,
  });
}

export function useComplex(id: string) {
  return useQuery({
    queryKey: complexKeys.detail(id),
    queryFn: () => complexesApi.detail(id),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateComplex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ResidentialComplex>) => complexesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: complexKeys.all() }),
  });
}

export function useUpdateComplex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResidentialComplex> }) =>
      complexesApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: complexKeys.list() });
      qc.invalidateQueries({ queryKey: complexKeys.detail(id) });
    },
  });
}

export function useDeleteComplex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => complexesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: complexKeys.all() }),
  });
}
