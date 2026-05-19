import { cn } from '@/lib/utils/cn';

type TintColor = 'blue' | 'green' | 'orange' | 'purple' | 'indigo' | 'red';

interface KPIWidgetProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  tint?: TintColor;
  className?: string;
}

const tintIconColors: Record<TintColor, string> = {
  blue:   'text-[var(--ios-blue)]',
  green:  'text-[var(--ios-green)]',
  orange: 'text-[var(--ios-orange)]',
  purple: 'text-[var(--ios-purple)]',
  indigo: 'text-[var(--ios-indigo)]',
  red:    'text-[var(--ios-red)]',
};

export function KPIWidget({ label, value, delta, deltaLabel, icon, tint, className }: KPIWidgetProps) {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden squircle-card p-5 flex flex-col gap-2',
        'border-[0.5px]',
        className,
      )}
      style={{
        background: 'var(--bg-elevated)',
        borderColor: 'var(--separator)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Tint overlay */}
      {tint && (
        <div className={cn('absolute inset-0 pointer-events-none', `tint-${tint}`)} />
      )}

      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--label-secondary)] uppercase tracking-[0.06em]">
          {label}
        </span>
        {icon && (
          <span className={cn(
            'w-8 h-8 rounded-[10px] flex items-center justify-center',
            tint ? tintIconColors[tint] : 'text-[var(--label-tertiary)]',
          )}
            style={{ background: 'var(--fill-tertiary)' }}
          >
            {icon}
          </span>
        )}
      </div>

      <span className="relative text-[28px] font-bold text-[var(--label-primary)] leading-none tabular-nums tracking-tight">
        {value}
      </span>

      {delta !== undefined && (
        <div className="relative flex items-center gap-1.5">
          <span
            className={cn(
              'text-[12px] font-semibold px-1.5 py-0.5 rounded-md',
              isPositive
                ? 'text-[var(--ios-green)] bg-green-500/10'
                : 'text-[var(--ios-red)] bg-red-500/10',
            )}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
          {deltaLabel && (
            <span className="text-[11px] text-[var(--label-tertiary)]">{deltaLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
