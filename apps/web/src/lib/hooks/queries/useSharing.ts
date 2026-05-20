'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sharingApi } from '../../api/sharing';

export const sharingKeys = {
  pending: () => ['sharing', 'pending'] as const,
};

export function usePendingSharingRequests() {
  return useQuery({
    queryKey: sharingKeys.pending(),
    queryFn: sharingApi.listPending,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useRequestAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => sharingApi.request(propertyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: sharingKeys.pending() }),
  });
}

export function useApproveSharing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sharingApi.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: sharingKeys.pending() }),
  });
}

export function useDenySharing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sharingApi.deny(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: sharingKeys.pending() }),
  });
}
