'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface CardGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

const spacingStyles = {
  tight: 'gap-4',
  normal: 'gap-6',
  loose: 'gap-8'
};

export function CardGrid({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  spacing = 'normal',
  className 
}: CardGridProps) {
  return (
    <div
      className={cn(
        'grid w-full',
        spacingStyles[spacing],
        `grid-cols-${columns.mobile}`,
        `md:grid-cols-${columns.tablet}`,
        `lg:grid-cols-${columns.desktop}`,
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardItemProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function CardItem({ 
  title, 
  subtitle, 
  children, 
  className,
  onClick 
}: CardItemProps) {
  return (
    <Card
      className={cn(
        'p-4 hover:shadow-lg transition-shadow duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </Card>
  );
} 