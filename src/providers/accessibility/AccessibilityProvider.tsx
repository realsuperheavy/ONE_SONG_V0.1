'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { LiveAnnouncer } from '@/components/a11y/LiveAnnouncer';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface AccessibilityState {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardMode: boolean;
  fontSize: number;
}

interface AccessibilityContextType extends AccessibilityState {
  announceMessage: (message: string, assertive?: boolean) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccessibilityState>({
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    keyboardMode: false,
    fontSize: 16
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setState(prev => ({ ...prev, keyboardMode: true }));
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, keyboardMode: false }));
      document.body.classList.remove('keyboard-navigation');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Apply accessibility classes
  useEffect(() => {
    document.documentElement.style.fontSize = `${state.fontSize}px`;
    document.documentElement.classList.toggle('high-contrast', state.highContrast);
    document.documentElement.classList.toggle('reduced-motion', state.reducedMotion);

    analyticsService.trackEvent('accessibility_settings_changed', {
      settings: state
    });
  }, [state]);

  const announceMessage = (message: string, assertive = false) => {
    const event = new CustomEvent('announce', {
      detail: { message, assertive }
    });
    window.dispatchEvent(event);
  };

  const value = {
    ...state,
    announceMessage,
    toggleHighContrast: () => 
      setState(prev => ({ ...prev, highContrast: !prev.highContrast })),
    toggleReducedMotion: () => 
      setState(prev => ({ ...prev, reducedMotion: !prev.reducedMotion })),
    increaseFontSize: () => 
      setState(prev => ({ ...prev, fontSize: Math.min(prev.fontSize + 2, 24) })),
    decreaseFontSize: () => 
      setState(prev => ({ ...prev, fontSize: Math.max(prev.fontSize - 2, 12) }))
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <LiveAnnouncer />
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}; 