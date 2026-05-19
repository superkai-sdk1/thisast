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
  large?: boolean;
  subtitle?: string;
}

export function GlassNavBar({
  title, left, right, showSafeToggle = true, className, large, subtitle,
}: GlassNavBarProps) {
  const { clientSafeMode, toggleClientSafeMode } = useAppStore();

  return (
    <header
      className={cn('sticky top-0 z-20 glass-nav', className)}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Main bar */}
      <div className="relative flex items-center justify-between h-11 px-4">
        <div className="w-20 flex justify-start text-[var(--ios-blue)]">{left}</div>

        {!large && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-semibold text-[var(--label-primary)] truncate max-w-[60%] tracking-tight">
            {title}
          </h1>
        )}

        <div className="w-20 flex justify-end items-center gap-0.5">
          {showSafeToggle && (
            <button
              onClick={toggleClientSafeMode}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                clientSafeMode
                  ? 'text-[var(--ios-orange)] bg-orange-500/10'
                  : 'text-[var(--label-tertiary)] hover:text-[var(--label-secondary)]',
              )}
              aria-label={clientSafeMode ? 'Выключить режим клиента' : 'Включить режим клиента'}
            >
              {clientSafeMode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          <div className="text-[var(--ios-blue)]">{right}</div>
        </div>
      </div>

      {/* Large title mode */}
      {large && (
        <div className="px-4 pb-3">
          <h1 className="text-[30px] font-bold text-[var(--label-primary)] tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[14px] text-[var(--label-secondary)] mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
    </header>
  );
}
