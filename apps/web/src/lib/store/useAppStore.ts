'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@crm/shared-types';

interface AppState {
  // Auth
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;

  // Client-safe mode — NOT persisted (security: reset each session)
  clientSafeMode: boolean;
  toggleClientSafeMode: () => void;
  setClientSafeMode: (value: boolean) => void;

  // Active bottom sheet
  activeSheet: string | null;
  openSheet: (id: string) => void;
  closeSheet: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),

      clientSafeMode: false,
      toggleClientSafeMode: () => set((s) => ({ clientSafeMode: !s.clientSafeMode })),
      setClientSafeMode: (value) => set({ clientSafeMode: value }),

      activeSheet: null,
      openSheet: (id) => set({ activeSheet: id }),
      closeSheet: () => set({ activeSheet: null }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as unknown as Storage))),
      // Persist only auth, NOT clientSafeMode
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    },
  ),
);
