'use client';

import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/lib/store/useAppStore';
import { useRouter } from 'next/navigation';

interface GlassNavBarProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showSafeToggle?: boolean;
  showBack?: boolean;
  className?: string;
  large?: boolean;
  subtitle?: string;
  border?: boolean;
}

export function GlassNavBar({
  title, left, right, showSafeToggle = false, showBack = false,
  className, large, subtitle, border = true,
}: GlassNavBarProps) {
  const { clientSafeMode, toggleClientSafeMode } = useAppStore();
  const router = useRouter();

  return (
    <header
      className={cn('sticky top-0 z-20 glass-nav', !border && 'border-b-0', className)}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="relative flex items-center justify-between h-11 px-4">
        {/* Left */}
        <div className="w-24 flex justify-start">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-0.5 -ml-1 press-scale"
              style={{ color: 'var(--ios-blue)' }}
            >
              <ChevronLeft size={20} strokeWidth={2.2} />
              <span className="text-[17px] font-normal">Назад</span>
            </button>
          ) : (
            <div style={{ color: 'var(--ios-blue)' }}>{left}</div>
          )}
        </div>

        {/* Center title (compact mode) */}
        {!large && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold tracking-tight truncate max-w-[55%]"
            style={{ color: 'var(--label-primary)' }}>
            {title}
          </h1>
        )}

        {/* Right */}
        <div className="w-24 flex justify-end items-center gap-1">
          {showSafeToggle && (
            <button
              onClick={toggleClientSafeMode}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-colors press-scale',
                clientSafeMode
                  ? 'bg-orange-500/12'
                  : 'hover:bg-[var(--fill-tertiary)]',
              )}
              style={{ color: clientSafeMode ? 'var(--ios-orange)' : 'var(--label-tertiary)' }}
              aria-label={clientSafeMode ? 'Выключить режим клиента' : 'Включить режим клиента'}
            >
              {clientSafeMode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          <div style={{ color: 'var(--ios-blue)' }}>{right}</div>
        </div>
      </div>

      {/* Large title */}
      {large && (
        <div className="px-4 pb-2">
          <h1 className="text-[32px] font-bold tracking-tight leading-tight"
            style={{ color: 'var(--label-primary)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-[15px] mt-0.5" style={{ color: 'var(--label-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  );
}
