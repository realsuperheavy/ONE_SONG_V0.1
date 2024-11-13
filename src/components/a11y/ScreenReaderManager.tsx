'use client';

import { useEffect, useRef } from 'react';
import { useAccessibility } from '@/providers/accessibility/AccessibilityProvider';

interface AnnouncementQueue {
  message: string;
  priority: 'polite' | 'assertive';
}

export function ScreenReaderManager() {
  const { announceMessage } = useAccessibility();
  const queueRef = useRef<AnnouncementQueue[]>([]);
  const processingRef = useRef(false);

  useEffect(() => {
    const processQueue = async () => {
      if (processingRef.current || queueRef.current.length === 0) return;

      processingRef.current = true;
      const announcement = queueRef.current.shift();

      if (announcement) {
        const element = document.createElement('div');
        element.setAttribute('aria-live', announcement.priority);
        element.className = 'sr-only';
        document.body.appendChild(element);

        // Wait for screen reader to process
        await new Promise(resolve => setTimeout(resolve, 50));
        element.textContent = announcement.message;

        // Clean up after announcement
        await new Promise(resolve => setTimeout(resolve, 1000));
        element.remove();
      }

      processingRef.current = false;
      if (queueRef.current.length > 0) {
        processQueue();
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              // Enhance dynamic content with ARIA attributes
              enhanceWithAria(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [announceMessage]);

  const enhanceWithAria = (element: HTMLElement) => {
    // Add missing ARIA labels
    if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label')) {
      const text = element.textContent?.trim();
      if (text) element.setAttribute('aria-label', text);
    }

    // Add role descriptions
    if (element.classList.contains('card')) {
      element.setAttribute('role', 'region');
    }

    // Add live regions for dynamic content
    if (element.classList.contains('queue-item')) {
      element.setAttribute('aria-live', 'polite');
    }
  };

  return null;
} 