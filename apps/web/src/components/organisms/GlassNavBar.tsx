'use client';

import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/lib/store/useAppStore';

interface GlassNavBarProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showSafeToggle?: boolean;
  className?: string;
}

export function GlassNavBar({ title, left, right, showSafeToggle = true, className }: GlassNavBarProps) {
  const { clientSafeMode, toggleClientSafeMode } = useAppStore();

  return (
    <header
      className={cn(
        'sticky top-0 z-20 glass-nav',
        'pt-[env(safe-area-inset-top)]',
        className,
      )}
    >
      <div className="relative flex items-center justify-between h-11 px-4">
        <div className="w-20 flex justify-start">{left}</div>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-[var(--label-primary)] truncate max-w-[60%]">
          {title}
        </h1>
        <div className="w-20 flex justify-end items-center gap-1">
          {showSafeToggle && (
            <button
              onClick={toggleClientSafeMode}
              className={cn(
                'p-2 rounded-full transition-colors',
                clientSafeMode
                  ? 'text-[var(--ios-orange)] bg-[var(--ios-orange)]/10'
                  : 'text-[var(--label-tertiary)]',
              )}
              aria-label={clientSafeMode ? 'Выключить режим клиента' : 'Включить режим клиента'}
            >
              {clientSafeMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {right}
        </div>
      </div>
    </header>
  );
}
