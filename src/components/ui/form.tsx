'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* Input */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  loading?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, loading, ...props }, ref) => (
    <div className="space-y-1">
      <input
        className={cn(
          'w-full px-3 py-2 bg-white/5 border border-white/10',
          'rounded-md transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          'placeholder:text-white/50',
          error && 'border-red-500 focus:ring-red-500',
          loading && 'opacity-50 cursor-wait',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
);
Input.displayName = 'Input';

/* Select */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, ...props }, ref) => (
    <div className="space-y-1">
      <select
        className={cn(
          'w-full px-3 py-2 bg-white/5 border border-white/10',
          'rounded-md transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        ref={ref}
        {...props}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
);
Select.displayName = 'Select';
