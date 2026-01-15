'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-400/10 border-gray-400/30 text-gray-400',
      success: 'bg-green-400/10 border-green-400/30 text-green-400',
      warning: 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400',
      danger: 'bg-red-400/10 border-red-400/30 text-red-400',
      info: 'bg-blue-400/10 border-blue-400/30 text-blue-400',
      purple: 'bg-purple-400/10 border-purple-400/30 text-purple-400',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
