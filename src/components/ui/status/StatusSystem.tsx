'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { announce } from '@/components/a11y/LiveAnnouncer';
import { analyticsService } from '@/lib/firebase/services/analytics';

type StatusType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'loading' 
  | 'offline' 
  | 'online';

const statusConfig = {
  success: {
    color: '#4CAF50',
    icon: '✓',
    animation: 'animate-success'
  },
  error: {
    color: '#FF4D4D',
    icon: '✕',
    animation: 'animate-error'
  },
  warning: {
    color: '#F49620',
    icon: '!',
    animation: 'animate-warning'
  },
  info: {
    color: '#2196F3',
    icon: 'i',
    animation: 'animate-info'
  },
  loading: {
    color: '#F49620',
    icon: '↻',
    animation: 'animate-spin'
  },
  offline: {
    color: '#9E9E9E',
    icon: '⚪',
    animation: 'animate-pulse'
  },
  online: {
    color: '#4CAF50',
    icon: '⚪',
    animation: ''
  }
};

interface StatusIndicatorProps {
  type: StatusType;
  message?: string;
  className?: string;
  announceToScreenReader?: boolean;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusIndicator({
  type,
  message,
  className,
  announceToScreenReader = true,
  showIcon = true,
  showText = true,
  size = 'md'
}: StatusIndicatorProps) {
  useEffect(() => {
    if (announceToScreenReader && message) {
      announce(`${type}: ${message}`);
    }

    analyticsService.trackEvent('status_change', {
      type,
      message
    });
  }, [type, message, announceToScreenReader]);

  const sizeClasses = {
    sm: 'h-2 w-2 text-xs',
    md: 'h-3 w-3 text-sm',
    lg: 'h-4 w-4 text-base'
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {showIcon && (
        <span
          className={cn(
            'rounded-full flex items-center justify-center',
            statusConfig[type].animation,
            sizeClasses[size]
          )}
          style={{ backgroundColor: statusConfig[type].color }}
          aria-hidden="true"
        >
          {statusConfig[type].icon}
        </span>
      )}
      {showText && message && (
        <span className={cn(
          'text-sm',
          type === 'error' && 'text-red-500',
          type === 'success' && 'text-green-500'
        )}>
          {message}
        </span>
      )}
    </div>
  );
}

// Progress Indicator Component
interface ProgressIndicatorProps {
  progress: number;
  type?: StatusType;
  className?: string;
}

export function ProgressIndicator({
  progress,
  type = 'info',
  className
}: ProgressIndicatorProps) {
  return (
    <div
      className={cn(
        'w-full h-2 bg-gray-200 rounded-full overflow-hidden',
        className
      )}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full transition-all duration-300',
          type === 'success' && 'bg-green-500',
          type === 'error' && 'bg-red-500',
          type === 'warning' && 'bg-[#F49620]',
          type === 'info' && 'bg-blue-500'
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
} 