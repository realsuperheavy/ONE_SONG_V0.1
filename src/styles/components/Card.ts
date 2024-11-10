import { cva } from 'class-variance-authority';

export const cardStyles = cva(
  [
    'rounded-xl',
    'bg-gradient-to-b from-background-gradient-from to-background-gradient-to',
    'border border-white/10',
    'transition-all duration-200',
    'hover:border-brand-primary/20',
    'hover:shadow-lg hover:shadow-brand-primary/5',
  ],
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
); 