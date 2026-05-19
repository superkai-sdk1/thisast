import { forwardRef } from 'react';
import type { FieldError } from 'react-hook-form';
import { cn } from '@/lib/utils/cn';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-medium text-[var(--label-primary)]">
          {label}
        </label>

        <input
          ref={ref}
          id={fieldId}
          className={cn(
            'w-full px-4 py-3 rounded-[14px] text-sm',
            'bg-[var(--fill-tertiary)] text-[var(--label-primary)]',
            'placeholder:text-[var(--label-tertiary)]',
            'border border-transparent outline-none',
            'transition-colors',
            'focus:border-[var(--ios-blue)] focus:bg-[var(--fill-secondary)]',
            error && 'border-[var(--ios-red)] focus:border-[var(--ios-red)]',
            className,
          )}
          {...props}
        />

        {error && (
          <p className="text-xs text-[var(--ios-red)]">{error.message}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--label-tertiary)]">{hint}</p>
        )}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
