'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[] | string[];
  value: T | number;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

const SPRING = { type: 'spring', stiffness: 500, damping: 45 } as const;

export function SegmentedControl<T extends string>({
  options, value, onChange, size = 'md', className,
}: SegmentedControlProps<T>) {
  const normalized: Option<T>[] = (options as (Option<T> | string)[]).map((opt, i) =>
    typeof opt === 'string'
      ? { value: String(i) as T, label: opt }
      : opt,
  );

  const activeValue = typeof value === 'number' ? String(value) as T : value;

  return (
    <div
      role="tablist"
      className={cn(
        'relative flex bg-[var(--fill-tertiary)] rounded-[10px] p-[2px]',
        size === 'sm' ? 'h-8' : 'h-9',
        className,
      )}
    >
      {normalized.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={activeValue === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative flex-1 z-10 flex items-center justify-center gap-1',
            'text-[13px] font-semibold transition-colors duration-100',
            activeValue === opt.value
              ? 'text-[var(--label-primary)]'
              : 'text-[var(--label-secondary)]',
          )}
        >
          {activeValue === opt.value && (
            <motion.div
              layoutId="segmented-indicator"
              transition={SPRING}
              className="absolute inset-0 bg-white dark:bg-[#3A3A3C] rounded-[8px] shadow-sm"
            />
          )}
          <span className="relative z-10">{opt.label}</span>
          {opt.count !== undefined && (
            <span className="relative z-10 opacity-60 text-[11px]">{opt.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
