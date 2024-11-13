'use client';

import * as React from 'react';
import { useEffect } from 'react';

interface FocusScopeProps {
  children: React.ReactNode;
  trapped?: boolean;
  autoFocus?: boolean;
}

export function FocusScope({ 
  children, 
  trapped = false,
  autoFocus = true 
}: FocusScopeProps) {
  const scopeRef = React.useRef<HTMLDivElement>(null);
  const focusableElements = React.useRef<HTMLElement[]>([]);

  useEffect(() => {
    if (scopeRef.current) {
      focusableElements.current = Array.from(
        scopeRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[];

      if (autoFocus && focusableElements.current.length > 0) {
        focusableElements.current[0].focus();
      }
    }
  }, [autoFocus]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!trapped || focusableElements.current.length === 0) return;

    if (event.key === 'Tab') {
      const firstElement = focusableElements.current[0];
      const lastElement = focusableElements.current[focusableElements.current.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  return (
    <div ref={scopeRef} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
} 