import { useEffect, useRef } from 'react';

interface KeyboardNavigationOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
  disabled?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions) => {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (options.disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const opts = optionsRef.current;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          opts.onArrowUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          opts.onArrowDown?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          opts.onArrowLeft?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          opts.onArrowRight?.();
          break;
        case 'Enter':
          e.preventDefault();
          opts.onEnter?.();
          break;
        case 'Escape':
          e.preventDefault();
          opts.onEscape?.();
          break;
        case ' ':
          e.preventDefault();
          opts.onSpace?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options.disabled]);
}; 