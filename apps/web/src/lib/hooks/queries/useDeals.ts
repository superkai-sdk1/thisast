'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi } from '../../api/deals';

export const dealKeys = {
  all:     () => ['deals'] as const,
  summary: () => ['deals', 'summary'] as const,
  list:    () => ['deals', 'list'] as const,
  detail:  (id: string) => ['deals', 'detail', id] as const,
};

export function useDealsSummary() {
  return useQuery({
    queryKey: dealKeys.summary(),
    queryFn: dealsApi.summary,
    staleTime: 2 * 60 * 1000,
  });
}

export function useDeals() {
  return useQuery({
    queryKey: dealKeys.list(),
    queryFn: dealsApi.list,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dealsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealKeys.list() });
      qc.invalidateQueries({ queryKey: dealKeys.summary() });
    },
  });
}
