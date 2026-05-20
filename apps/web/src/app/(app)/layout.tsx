'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { BottomTabBar } from '@/components/organisms/BottomTabBar';
import { Sidebar } from '@/components/organisms/Sidebar';
import { AppHeader } from '@/components/organisms/AppHeader';
import { PushNotificationPrompt } from '@/components/organisms/PushNotificationPrompt';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, clientSafeMode } = useAppStore();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop sidebar — narrow icon rail, expands on hover */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        {/* Desktop global header */}
        <AppHeader />

        {/* Client-safe banner */}
        {clientSafeMode && (
          <div
            className="flex items-center justify-center gap-2 py-1.5 text-white text-[12px] font-semibold"
            style={{ background: 'var(--ios-orange)' }}
          >
            <span>👁️</span>
            <span>Режим клиента — персональные данные скрыты</span>
          </div>
        )}

        {/* Page content */}
        <main
          className="flex-1 flex flex-col"
          style={{ paddingBottom: 'var(--tab-bar-height)' }}
        >
          <div className="flex-1 md:max-w-[1024px] md:w-full md:mx-auto w-full flex flex-col">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile floating dock */}
      <BottomTabBar />
      <PushNotificationPrompt />
    </div>
  );
}
