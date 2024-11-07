import { useRef, useEffect } from 'react';

export const useFocusTrap = (isActive: boolean = true) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const root = ref.current;
    if (!root) return;

    const focusableElements = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    root.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => root.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return ref;
}; 