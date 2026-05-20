import { cn } from '@/lib/utils/cn';

type TintColor = 'blue' | 'green' | 'orange' | 'purple' | 'indigo' | 'red' | 'teal';

interface KPIWidgetProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  tint?: TintColor;
  className?: string;
}

const tintConfig: Record<TintColor, {
  icon: string;
  bg: string;
  shadow: string;
  glow: string;
}> = {
  blue:   { icon: 'var(--neon-blue)',   bg: 'rgba(79,117,255,0.14)',   shadow: '0 4px 16px rgba(79,117,255,0.22)', glow: '0 0 12px rgba(79,117,255,0.40)' },
  green:  { icon: 'var(--ios-green)',   bg: 'rgba(52,199,89,0.12)',    shadow: '0 4px 16px rgba(52,199,89,0.20)',  glow: '0 0 12px rgba(52,199,89,0.35)'  },
  orange: { icon: 'var(--ios-orange)',  bg: 'rgba(255,149,0,0.12)',    shadow: '0 4px 16px rgba(255,149,0,0.20)',  glow: '0 0 12px rgba(255,149,0,0.35)'  },
  purple: { icon: 'var(--neon-purple)', bg: 'rgba(200,75,255,0.14)',   shadow: '0 4px 16px rgba(200,75,255,0.22)', glow: '0 0 12px rgba(200,75,255,0.40)' },
  indigo: { icon: 'var(--ios-indigo)',  bg: 'rgba(88,86,214,0.12)',    shadow: '0 4px 16px rgba(88,86,214,0.20)',  glow: '0 0 12px rgba(88,86,214,0.35)'  },
  red:    { icon: 'var(--ios-red)',     bg: 'rgba(255,59,48,0.12)',    shadow: '0 4px 16px rgba(255,59,48,0.20)',  glow: '0 0 12px rgba(255,59,48,0.32)'  },
  teal:   { icon: 'var(--neon-teal)',   bg: 'rgba(6,239,197,0.12)',    shadow: '0 4px 16px rgba(6,239,197,0.20)',  glow: '0 0 12px rgba(6,239,197,0.38)'  },
};

export function KPIWidget({ label, value, delta, deltaLabel, icon, tint, className }: KPIWidgetProps) {
  const isPositive = delta !== undefined && delta >= 0;
  const cfg = tint ? tintConfig[tint] : null;

  return (
    <div
      className={cn(
        'relative overflow-hidden squircle-card p-4 flex flex-col gap-3 float-up',
        className,
      )}
      style={{
        background:  'var(--bg-elevated)',
        border:      '1px solid var(--separator)',
        boxShadow:   'var(--shadow-card)',
      }}
    >
      {/* Subtle tint gradient */}
      {tint && (
        <div className={cn('absolute inset-0 pointer-events-none opacity-70', `tint-${tint}`)} />
      )}

      {/* Label + icon */}
      <div className="relative flex items-start justify-between gap-2">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--label-tertiary)' }}
        >
          {label}
        </span>
        {icon && cfg && (
          <span
            className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{
              background: cfg.bg,
              color:      cfg.icon,
              boxShadow:  `${cfg.shadow}, ${cfg.glow}`,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <span
        className="relative text-[30px] font-bold leading-none tabular-nums tracking-tight"
        style={{ color: 'var(--label-primary)' }}
      >
        {value}
      </span>

      {/* Delta badge */}
      {delta !== undefined && (
        <div className="relative flex items-center gap-1.5">
          <span
            className="text-[12px] font-semibold px-1.5 py-[3px] rounded-[7px]"
            style={{
              color:      isPositive ? 'var(--ios-green)' : 'var(--ios-red)',
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
