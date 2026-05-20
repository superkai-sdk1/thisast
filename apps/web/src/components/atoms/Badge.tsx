import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'destructive' | 'match' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  default:     'badge-gray',
  success:     'badge-green',
  warning:     'badge-orange',
  error:       'badge-red',
  destructive: 'badge-red',
  info:        'badge-blue',
  match:       'bg-[var(--ios-blue)] text-white',
  purple:      'badge-purple',
};

const sizeClasses = {
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-[12px] px-2.5 py-[3px]',
};

export function Badge({ label, children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-[8px] font-semibold whitespace-nowrap',
      sizeClasses[size],
      variantClasses[variant],
      className,
    )}>
      {children ?? label}
    </span>
  );
}
