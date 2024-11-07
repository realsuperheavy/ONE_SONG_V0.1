import { COMPONENTS, ACCESSIBILITY, ANIMATIONS } from '@/design/tokens';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  ...props
}, ref) => {
  const baseStyles = COMPONENTS.button.base;
  const variantStyles = COMPONENTS.button[variant];
  const accessibilityStyles = ACCESSIBILITY.focus.visible;
  const animation = loading ? ANIMATIONS.effects.pulse : '';

  return (
    <button
      ref={ref}
      className={`
        ${baseStyles}
        ${variantStyles}
        ${accessibilityStyles}
        ${animation}
        ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
      aria-busy={loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⟳</span>
          Loading...
        </span>
      ) : children}
    </button>
  );
});

Button.displayName = 'Button'; 