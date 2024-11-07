import { cn } from '@/lib/utils';
import { COMPONENTS, EFFECTS, INTERACTIONS } from '@/design/tokens';
import { useTouchInteraction } from '@/hooks/useTouchInteraction';

interface CardProps {
  children: React.ReactNode;
  interactive?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  onSwipe?: (direction: 'left' | 'right') => void;
  className?: string;
  'aria-label'?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  elevated = false,
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

  return (
    <div
      className={cn(
        COMPONENTS.card.base,
        interactive && COMPONENTS.card.interactive,
        elevated && COMPONENTS.card.elevated,
        interactive && INTERACTIONS.hover.scale,
        className
      )}
      role={interactive ? 'button' : 'article'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      {...touchHandlers}
    >
      {children}
    </div>
  );
}; 