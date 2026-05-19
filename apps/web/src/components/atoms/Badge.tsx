import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'destructive' | 'match' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  default:     'bg-[var(--fill-secondary)] text-[var(--label-secondary)]',
  success:     'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  warning:     'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
  error:       'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  destructive: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  info:        'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  match:       'bg-[var(--ios-blue)] text-white',
};

const sizeClasses = {
  sm: 'text-[11px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
};

export function Badge({ label, children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md font-medium', sizeClasses[size], variantClasses[variant], className)}>
      {children ?? label}
    </span>
  );
}
