import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'w-full bg-[#1E1E1E] border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-[#F49620] disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'focus:ring-[#F49620]/50',
        error: 'border-red-500 focus:ring-red-500/50',
      },
      inputSize: {
        sm: 'h-8 text-sm',
        md: 'h-10',
        lg: 'h-12 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "error";
  inputSize?: "sm" | "md" | "lg";
  error?: boolean;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  variant,
  inputSize,
  error,
  helperText,
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      <input
        ref={ref}
        className={cn(inputVariants({ variant: error ? 'error' : variant, inputSize: inputSize }), className)}
        {...props}
      />
      {helperText && (
        <p className={cn(
          'text-sm',
          error ? 'text-red-500' : 'text-white/70'
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
