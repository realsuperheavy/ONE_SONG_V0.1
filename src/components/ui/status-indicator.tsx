'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

type StatusType = 'online' | 'offline' | 'loading' | 'error';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  animate?: boolean;
  className?: string;
}

const statusStyles = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  loading: 'bg-[#F49620]',
  error: 'bg-red-500'
};

const statusAnimations = {
  online: '',
  offline: '',
  loading: 'animate-pulse',
  error: 'animate-ping'
};

export function StatusIndicator({ 
  status, 
  label, 
  animate = true,
  className 
}: StatusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Blink effect for error status
  useEffect(() => {
    if (status === 'error' && animate) {
      const interval = setInterval(() => {
        setIsVisible(v => !v);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status, animate]);

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          statusStyles[status],
          animate && statusAnimations[status],
          !isVisible && 'opacity-0',
          className
        )}
        role="status"
        aria-label={status}
      />
      {label && (
        <span className="text-sm text-gray-500">
          {label}
        </span>
      )}
    </div>
  );
} 