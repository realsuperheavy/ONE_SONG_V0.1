'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { breakpoints } from '@/lib/responsive/breakpoints';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  onBreakpointChange?: (breakpoint: 'mobile' | 'tablet' | 'desktop') => void;
}

export function ResponsiveContainer({ 
  children, 
  className,
  onBreakpointChange 
}: ResponsiveContainerProps) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newBreakpoint: 'mobile' | 'tablet' | 'desktop' = 'mobile';

      if (width > breakpoints.tablet) {
        newBreakpoint = 'desktop';
      } else if (width > breakpoints.mobile) {
        newBreakpoint = 'tablet';
      }

      if (newBreakpoint !== currentBreakpoint) {
        setCurrentBreakpoint(newBreakpoint);
        onBreakpointChange?.(newBreakpoint);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, [currentBreakpoint, onBreakpointChange]);

  return (
    <div 
      className={cn(
        'w-full transition-all duration-300',
        currentBreakpoint === 'mobile' && 'stack-layout',
        currentBreakpoint === 'tablet' && 'two-column-layout',
        currentBreakpoint === 'desktop' && 'multi-column-layout',
        className
      )}
    >
      {children}
    </div>
  );
} 