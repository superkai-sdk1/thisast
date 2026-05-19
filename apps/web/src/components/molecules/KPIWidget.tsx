import { cn } from '@/lib/utils/cn';

interface KPIWidgetProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function KPIWidget({ label, value, delta, deltaLabel, icon, className }: KPIWidgetProps) {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <div className={cn('glass-card squircle-card p-4 flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--label-secondary)] uppercase tracking-wide">
          {label}
        </span>
        {icon && <span className="text-[var(--label-tertiary)]">{icon}</span>}
      </div>

      <span className="text-2xl font-bold text-[var(--label-primary)] leading-tight tabular-nums">
        {value}
      </span>

      {delta !== undefined && (
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'text-xs font-semibold',
              isPositive ? 'text-[var(--ios-green)]' : 'text-[var(--ios-red)]',
            )}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
          {deltaLabel && (
            <span className="text-xs text-[var(--label-tertiary)]">{deltaLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
