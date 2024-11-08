import { cn } from '@/lib/utils';
import { COMPONENTS, EFFECTS, ANIMATIONS, TYPOGRAPHY } from '@/design/tokens';
import { useTouchInteraction } from '@/hooks/useTouchInteraction';
import type { TouchEventHandler } from 'react';

interface CardProps {
  children: React.ReactNode;
  interactive?: boolean;
  elevated?: boolean;
  gradient?: boolean;
  onPress?: () => void;
  onSwipe?: (direction: 'left' | 'right') => void;
  className?: string;
  'aria-label'?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  elevated = false,
  gradient = false,
  onPress,
  onSwipe,
  className,
  'aria-label': ariaLabel
}) => {
  const { touchHandlers } = useTouchInteraction({
    onTap: onPress,
    onSwipe: onSwipe && ((direction) => {
      if (direction === 'left' || direction === 'right') {
        onSwipe(direction);
      }
    })
  });

  const handleTouchStart: TouchEventHandler<HTMLDivElement> = (event) => {
    touchHandlers.onTouchStart(event.nativeEvent);
  };

  const handleTouchEnd: TouchEventHandler<HTMLDivElement> = (event) => {
    touchHandlers.onTouchEnd(event.nativeEvent);
  };

  const handleTouchCancel: TouchEventHandler<HTMLDivElement> = () => {
    touchHandlers.onTouchCancel();
  };

  return (
    <div
      className={cn(
        COMPONENTS.card.base,
        TYPOGRAPHY.body.base,
        ANIMATIONS.transitions.base,
        interactive && [
          COMPONENTS.card.interactive,
          ANIMATIONS.hover.scale
        ],
        elevated && [
          COMPONENTS.card.elevated,
          ANIMATIONS.hover.lift
        ],
        gradient && "bg-gradient-to-b from-baseDark to-gradientDark",
        className
      )}
      role={interactive ? 'button' : 'article'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  );
}; 