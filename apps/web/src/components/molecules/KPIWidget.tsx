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

const tintConfig: Record<TintColor, { icon: string; bg: string; shadow: string }> = {
  blue:   { icon: 'var(--ios-blue)',   bg: 'rgba(0,122,255,0.12)',   shadow: '0 4px 16px rgba(0,122,255,0.18)' },
  green:  { icon: 'var(--ios-green)',  bg: 'rgba(52,199,89,0.12)',   shadow: '0 4px 16px rgba(52,199,89,0.18)' },
  orange: { icon: 'var(--ios-orange)', bg: 'rgba(255,149,0,0.12)',   shadow: '0 4px 16px rgba(255,149,0,0.18)' },
  purple: { icon: 'var(--ios-purple)', bg: 'rgba(175,82,222,0.12)',  shadow: '0 4px 16px rgba(175,82,222,0.18)' },
  indigo: { icon: 'var(--ios-indigo)', bg: 'rgba(88,86,214,0.12)',   shadow: '0 4px 16px rgba(88,86,214,0.18)' },
  red:    { icon: 'var(--ios-red)',    bg: 'rgba(255,59,48,0.12)',   shadow: '0 4px 16px rgba(255,59,48,0.18)' },
};

export function KPIWidget({ label, value, delta, deltaLabel, icon, tint, className }: KPIWidgetProps) {
  const isPositive = delta !== undefined && delta >= 0;
  const cfg = tint ? tintConfig[tint] : null;

  return (
    <div
      className={cn('relative overflow-hidden squircle-card p-4 flex flex-col gap-3', className)}
      style={{
        background: 'var(--bg-elevated)',
        border: '0.5px solid var(--separator)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Subtle tint background */}
      {tint && (
        <div className={cn('absolute inset-0 pointer-events-none opacity-60', `tint-${tint}`)} />
      )}

      <div className="relative flex items-start justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.07em]"
          style={{ color: 'var(--label-tertiary)' }}>
          {label}
        </span>
        {icon && cfg && (
          <span
            className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.icon, boxShadow: cfg.shadow }}
          >
            {icon}
          </span>
        )}
      </div>

      <span
        className="relative text-[30px] font-bold leading-none tabular-nums tracking-tight"
        style={{ color: 'var(--label-primary)' }}
      >
        {value}
      </span>

      {delta !== undefined && (
        <div className="relative flex items-center gap-1.5">
          <span
            className="text-[12px] font-semibold px-1.5 py-[3px] rounded-[7px]"
            style={{
              color: isPositive ? 'var(--ios-green)' : 'var(--ios-red)',
              background: isPositive ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)',
            }}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
          {deltaLabel && (
            <span className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>
              {deltaLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
