'use client';

import { cn } from '@/lib/utils';
import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-escrow-text-muted mb-2">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'w-full px-4 py-3 bg-escrow-surface-light border rounded-lg',
            'text-white placeholder-escrow-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-base-blue focus:border-transparent',
            'transition-all duration-200 resize-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-red-500' : 'border-escrow-border',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-escrow-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
