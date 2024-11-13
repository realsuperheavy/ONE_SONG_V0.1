'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonBaseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  ariaLabel?: string;
}

export const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonBaseProps>(
  ({ 
    className, 
    children, 
    disabled, 
    loading = false,
    loadingText = 'Loading...',
    ariaLabel,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'transition-colors duration-200',
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span className="sr-only">{loadingText}</span>
        ) : (
          children
        )}
      </button>
    );
  }
);
ButtonBase.displayName = 'ButtonBase'; 