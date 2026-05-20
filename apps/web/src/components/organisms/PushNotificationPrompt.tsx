'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/atoms/Button';
import { BottomSheet } from '@/components/molecules/BottomSheet';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushNotificationPrompt() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
    if (localStorage.getItem('push-dismissed')) {
      setDismissed(true);
    }
  }, []);

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await apiClient.post('/notifications/subscribe', sub.toJSON());
      setPermission('granted');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    localStorage.setItem('push-dismissed', '1');
    setDismissed(true);
    setOpen(false);
  }

  // Hide if already granted or dismissed by user
  if (permission === 'granted' || permission === 'denied' || dismissed) return null;

  return (
    <>
      {/* Compact floating bell button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center press-scale md:hidden"
        style={{
          background: 'var(--ios-blue)',
          boxShadow: '0 4px 16px rgba(0,122,255,0.45)',
        }}
        aria-label="Включить уведомления"
      >
        <Bell size={18} className="text-white" />
      </button>

      {/* Desktop: small pill in top-right of sidebar area */}
      <div className="hidden md:flex fixed top-4 right-4 z-20">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-full press-scale text-[12px] font-medium text-white"
          style={{ background: 'var(--ios-blue)', boxShadow: '0 2px 10px rgba(0,122,255,0.40)' }}
        >
          <Bell size={12} />
          Уведомления
        </button>
      </div>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Уведомления о подборах">
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-[var(--label-secondary)] text-center">
            Получайте мгновенные уведомления о новых совпадениях объектов с клиентами и важных событиях.
          </p>
          <Button onClick={subscribe} loading={loading} className="w-full">
            Разрешить уведомления
          </Button>
          <Button variant="ghost" onClick={dismiss} className="w-full">
            Больше не показывать
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
