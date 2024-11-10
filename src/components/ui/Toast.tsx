import { useState, useCallback } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function Toast({
  title,
  description,
  variant = 'default',
  duration = 3000,
  ...props
}: ToastProps) {
  return (
    <ToastPrimitive.Root
      className={cn(
        'fixed bottom-4 right-4 z-50 flex w-full max-w-sm items-center gap-4 rounded-lg border p-4 shadow-lg',
        'bg-[#2E2F2E] border-white/10',
        variant === 'destructive' && 'border-red-500/50 bg-red-500/10',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full'
      )}
      duration={duration}
      {...props}
    >
      <div className="grid gap-1">
        {title && (
          <ToastPrimitive.Title className="text-sm font-semibold text-white">
            {title}
          </ToastPrimitive.Title>
        )}
        {description && (
          <ToastPrimitive.Description className="text-sm text-gray-400">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-white focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

export const toast = {
  show: (props: ToastProps) => {
    const event = new CustomEvent('toast', { detail: props });
    window.dispatchEvent(event);
  }
}; 