'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { BottomSheet } from '@/components/molecules/BottomSheet';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install prompt after 30 seconds
      setTimeout(() => setOpen(true), 30_000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    setOpen(false);
  }

  if (!deferredPrompt) return null;

  return (
    <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Установить приложение">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 squircle-btn bg-[var(--ios-blue)] flex items-center justify-center flex-shrink-0">
            <Download className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[var(--label-primary)]">Эста CRM</p>
            <p className="text-sm text-[var(--label-secondary)]">
              Добавьте на рабочий стол для быстрого доступа без браузера
            </p>
          </div>
        </div>
        <Button onClick={handleInstall} className="w-full">
          Установить
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} className="w-full">
          Не сейчас
        </Button>
      </div>
    </BottomSheet>
  );
}
