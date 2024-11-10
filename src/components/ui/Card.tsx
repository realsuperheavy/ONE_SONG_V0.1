import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl bg-gradient-to-b from-[#1E1E1E] to-[#2E2F2E] border border-white/10 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'hover:border-[#F49620]/20 hover:shadow-lg hover:shadow-[#F49620]/5',
        interactive: 'cursor-pointer hover:scale-[1.02] hover:border-[#F49620]/20',
        selected: 'border-[#F49620] shadow-lg shadow-[#F49620]/10',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  as?: keyof JSX.IntrinsicElements;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
    {...props}
  />
));

Card.displayName = 'Card'; 