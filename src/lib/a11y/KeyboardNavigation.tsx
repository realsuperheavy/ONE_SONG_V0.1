'use client';

import { useEffect } from 'react';
import { useAccessibility } from '@/providers/accessibility/AccessibilityProvider';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export function KeyboardNavigationManager() {
  const { announceMessage } = useAccessibility();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search]');
        if (searchInput) {
          searchInput.focus();
          announceMessage('Search input focused');
        }
      }
    },
    {
      key: 'Escape',
      description: 'Close modal or menu',
      action: () => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.blur();
          announceMessage('Modal or menu closed');
        }
      }
    },
    {
      key: 'h',
      description: 'Go to home',
      ctrl: true,
      action: () => {
        window.location.href = '/';
        announceMessage('Navigating to home');
      }
    }
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => 
        s.key === event.key &&
        !!s.ctrl === event.ctrlKey &&
        !!s.shift === event.shiftKey &&
        !!s.alt === event.altKey
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
        analyticsService.trackEvent('keyboard_shortcut_used', {
          shortcut: shortcut.description
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return null;
} 