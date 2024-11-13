'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  loading?: boolean;
}

export function SearchField({ 
  className,
  onSearch,
  loading = false,
  ...props 
}: SearchFieldProps) {
  const [value, setValue] = useState('');

  const handleClear = () => {
    setValue('');
    onSearch?.('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onSearch?.(e.target.value);
        }}
        className={cn(
          'w-full pl-10 pr-8 py-2 bg-white/5',
          'border border-white/10 rounded-md',
          'placeholder:text-white/50',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          'transition duration-200',
          loading && 'opacity-50 cursor-wait',
          className
        )}
        {...props}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="h-4 w-4 text-white/50 hover:text-white" />
        </button>
      )}
    </div>
  );
} 