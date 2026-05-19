'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { BottomTabBar } from '@/components/organisms/BottomTabBar';
import { PushNotificationPrompt } from '@/components/organisms/PushNotificationPrompt';
import { cn } from '@/lib/utils/cn';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, clientSafeMode } = useAppStore();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <>
      {/* Client-Safe Mode amber banner */}
      {clientSafeMode && (
        <div className="fixed top-0 inset-x-0 z-50 bg-[var(--ios-orange)] text-white text-xs font-semibold text-center py-1 pt-[calc(0.25rem+env(safe-area-inset-top))]">
          Режим клиента — персональные данные скрыты
        </div>
      )}

      <main
        className={cn(
          'app-main',
          clientSafeMode && 'pt-7',
        )}
      >
        {children}
      </main>

      <BottomTabBar />
      <PushNotificationPrompt />
    </>
  );
}
