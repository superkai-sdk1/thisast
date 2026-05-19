'use client';

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { propertiesApi, type PropertyFilter } from '../../api/properties';
import type { Property } from '@crm/shared-types';

export const propertyKeys = {
  all:    ()                        => ['properties'] as const,
  lists:  ()                        => ['properties', 'list'] as const,
  list:   (f: PropertyFilter)       => ['properties', 'list', f] as const,
  detail: (id: string)              => ['properties', 'detail', id] as const,
  matches:(id: string)              => ['properties', 'matches', id] as const,
};

export function useProperties(filter: PropertyFilter) {
  return useQuery({
    queryKey: propertyKeys.list(filter),
    queryFn: () => propertiesApi.list(filter),
    staleTime: 60 * 1000,
  });
}

export function usePropertiesInfinite(filter: Omit<PropertyFilter, 'page'>) {
  return useInfiniteQuery({
    queryKey: propertyKeys.list(filter),
    queryFn: ({ pageParam = 1 }) =>
      propertiesApi.list({ ...filter, page: pageParam as number, limit: 20 }),
    getNextPageParam: (last) =>
      last.has_next ? last.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertiesApi.detail(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: propertiesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: propertyKeys.lists() }),
  });
}

export function useUpdateProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Property>) => propertiesApi.update(id, data),
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: propertyKeys.detail(id) });
      const previous = qc.getQueryData(propertyKeys.detail(id));
      qc.setQueryData(propertyKeys.detail(id), (old: Property) => old ? { ...old, ...newData } : old);
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(propertyKeys.detail(id), ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: propertyKeys.detail(id) });
      qc.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: propertiesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: propertyKeys.lists() }),
  });
}

export function usePropertyMatches(id: string) {
  return useQuery({
    queryKey: propertyKeys.matches(id),
    queryFn: () => propertiesApi.getMatches(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
