'use client';

import { useEffect } from 'react';
import { analyticsService } from '@/lib/firebase/services/analytics';

// WCAG AA requires a contrast ratio of at least 4.5:1 for normal text
// and 3:1 for large text
const MIN_CONTRAST_RATIO = 4.5;

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function ContrastChecker() {
  useEffect(() => {
    const checkContrast = () => {
      const elements = document.querySelectorAll('*');
      let issues: string[] = [];

      elements.forEach(element => {
        const style = window.getComputedStyle(element);
        const bgColor = style.backgroundColor;
        const textColor = style.color;

        // Convert colors to luminance
        const bgLuminance = luminance(/* parse bgColor */);
        const textLuminance = luminance(/* parse textColor */);
        
        const ratio = getContrastRatio(bgLuminance, textLuminance);
        
        if (ratio < MIN_CONTRAST_RATIO) {
          issues.push(`Contrast issue found: ${ratio.toFixed(2)}:1`);
        }
      });

      if (issues.length > 0) {
        analyticsService.trackEvent('contrast_issues_found', {
          issueCount: issues.length
        });
      }
    };

    // Run check on mount and when content changes
    const observer = new MutationObserver(checkContrast);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    return () => observer.disconnect();
  }, []);

  return null;
} 