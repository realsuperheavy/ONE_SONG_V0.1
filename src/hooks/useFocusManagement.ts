import { useRef, useEffect } from 'react';

interface FocusManagementOptions {
  autoFocus?: boolean;
  trapFocus?: boolean;
  returnFocus?: boolean;
}

export const useFocusManagement = ({
  autoFocus = false,
  trapFocus = false,
  returnFocus = true
}: FocusManagementOptions = {}) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (firstFocusable) {
        previousFocusRef.current = document.activeElement as HTMLElement;
        firstFocusable.focus();
      }
    }

    return () => {
      if (returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [autoFocus, returnFocus]);

  useEffect(() => {
    if (!trapFocus || !containerRef.current) return;

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener('keydown', handleFocusTrap);
    return () => document.removeEventListener('keydown', handleFocusTrap);
  }, [trapFocus]);

  return containerRef;
}; 