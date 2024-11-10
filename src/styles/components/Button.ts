import { cva } from 'class-variance-authority';

export const buttonStyles = cva(
  // Base styles
  [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-primary hover:bg-brand-highlight',
          'text-white',
          'focus:ring-brand-primary/50',
        ],
        secondary: [
          'border-2 border-brand-primary',
          'text-brand-primary hover:text-brand-highlight',
          'hover:border-brand-highlight',
          'focus:ring-brand-primary/50',
        ],
        ghost: [
          'text-brand-primary hover:text-brand-highlight',
          'hover:bg-brand-primary/10',
          'focus:ring-brand-primary/50',
        ],
      },
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
); 