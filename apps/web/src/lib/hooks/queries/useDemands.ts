'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demandsApi } from '../../api/demands';
import type { DemandFilter } from '../../api/demands';
import type { Demand } from '@crm/shared-types';

export const demandKeys = {
  all:      ()                    => ['demands'] as const,
  list:     (f?: DemandFilter)    => ['demands', 'list', f] as const,
  detail:   (id: string)          => ['demands', 'detail', id] as const,
  matches:  (id: string)          => ['demands', 'matches', id] as const,
  activity: (id: string)          => ['demands', 'activity', id] as const,
};

export function useDemands(filter?: DemandFilter) {
  return useQuery({
    queryKey: demandKeys.list(filter),
    queryFn: () => demandsApi.list(filter),
    staleTime: 60 * 1000,
  });
}

export function useDemand(id: string) {
  return useQuery({
    queryKey: demandKeys.detail(id),
    queryFn: () => demandsApi.detail(id),
    enabled: Boolean(id),
  });
}

export function useCreateDemand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: demandsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: demandKeys.all() }),
  });
}

export function useUpdateDemandStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      demandsApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: demandKeys.all() });
      // Optimistically update all cached demand list variants
      const cacheEntries = qc.getQueriesData<Demand[]>({ queryKey: demandKeys.all() });
      cacheEntries.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<Demand[]>(key, data.map(
          (d) => d.id === id ? { ...d, kanban_status: status as Demand['kanban_status'] } : d,
        ));
      });
      return { cacheEntries };
    },
    onError: (_e, _v, ctx) => {
      ctx?.cacheEntries.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: demandKeys.all() }),
  });
}

export function useDemandMatches(id: string) {
  return useQuery({
    queryKey: demandKeys.matches(id),
    queryFn: () => demandsApi.getMatches(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDemandActivity(id: string) {
  return useQuery({
    queryKey: demandKeys.activity(id),
    queryFn: () => demandsApi.getActivity(id),
    enabled: Boolean(id),
  });
}
