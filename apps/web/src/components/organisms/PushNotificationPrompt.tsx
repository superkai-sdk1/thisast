'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
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
  const [done, setDone] = useState(false);

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
      setDone(true);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (done) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-[var(--ios-blue)]/10 text-[var(--ios-blue)] text-sm font-medium"
      >
        <Bell className="w-4 h-4" />
        Включить уведомления
      </button>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Уведомления о подборах">
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-[var(--label-secondary)] text-center">
            Получайте мгновенные уведомления о новых совпадениях объектов с клиентами и важных событиях.
          </p>
          <Button onClick={subscribe} loading={loading} className="w-full">
            Разрешить уведомления
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)} className="w-full">
            Позже
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
