import { cva } from 'class-variance-authority';

export const inputStyles = cva(
  [
    'w-full',
    'bg-background-base',
    'border border-white/20',
    'rounded-lg',
    'px-4 py-2',
    'text-white',
    'placeholder:text-white/50',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-brand-primary/50',
    'focus:border-brand-primary',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      error: {
        true: 'border-state-error focus:ring-state-error/50',
      },
    },
  }
); 