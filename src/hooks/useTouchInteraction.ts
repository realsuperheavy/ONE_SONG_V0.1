import { useRef, useEffect } from 'react';

interface TouchOptions {
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onTap?: () => void;
  onLongPress?: () => void;
  threshold?: number;
  longPressDelay?: number;
}

export const useTouchInteraction = (options: TouchOptions = {}) => {
  const {
    onSwipe,
    onTap,
    onLongPress,
    threshold = 50,
    longPressDelay = 500
  } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    if (onLongPress) {
      longPressTimer.current = setTimeout(onLongPress, longPressDelay);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;

    clearTimeout(longPressTimer.current);

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const duration = Date.now() - touchStart.current.time;

    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && duration < 200) {
      onTap?.();
      return;
    }

    if (Math.abs(deltaX) >= threshold || Math.abs(deltaY) >= threshold) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (isHorizontal) {
        onSwipe?.(deltaX > 0 ? 'right' : 'left');
      } else {
        onSwipe?.(deltaY > 0 ? 'down' : 'up');
      }
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(longPressTimer.current);
    };
  }, []);

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: () => clearTimeout(longPressTimer.current)
    }
  };
}; 