'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { BottomTabBar } from '@/components/organisms/BottomTabBar';
import { Sidebar } from '@/components/organisms/Sidebar';
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
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        {/* Client-safe mode banner (mobile: below notch, desktop: at top of content) */}
        {clientSafeMode && (
          <div
            className="sticky top-0 z-40 flex items-center justify-center gap-2 py-1.5 text-white text-[12px] font-semibold"
            style={{
              background: 'var(--ios-orange)',
              paddingTop: 'max(0.375rem, env(safe-area-inset-top))',
            }}
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
          {/* Desktop: constrain content width */}
          <div className="flex-1 md:max-w-[960px] md:w-full md:mx-auto w-full flex flex-col">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
      <PushNotificationPrompt />
    </div>
  );
}
