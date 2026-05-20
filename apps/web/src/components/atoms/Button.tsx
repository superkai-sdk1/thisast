'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'tinted';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses = {
  primary:     'text-white active:opacity-80',
  secondary:   'bg-[var(--fill-secondary)] text-[var(--label-primary)] active:opacity-70',
  ghost:       'bg-transparent text-[var(--ios-blue)] active:bg-[var(--fill-tertiary)]',
  destructive: 'text-white active:opacity-80',
  tinted:      'text-[var(--ios-blue)] active:opacity-80',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-[52px] px-6 text-[16px] gap-2',
};

function variantStyle(variant: string): React.CSSProperties {
  if (variant === 'primary')     return { background: 'linear-gradient(135deg,#007AFF 0%,#0062CC 100%)', boxShadow: '0 4px 14px rgba(0,122,255,0.30)' };
  if (variant === 'destructive') return { background: 'linear-gradient(135deg,#FF3B30 0%,#CC2F26 100%)', boxShadow: '0 4px 14px rgba(255,59,48,0.28)' };
  if (variant === 'tinted')      return { background: 'rgba(0,122,255,0.12)' };
  return {};
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, leftIcon, rightIcon, className, children, disabled, style, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center squircle-btn font-semibold',
        'transition-all duration-100 select-none press-scale',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      style={{ ...variantStyle(variant), ...style }}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  ),
);
Button.displayName = 'Button';
