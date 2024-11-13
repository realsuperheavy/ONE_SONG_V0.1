'use client';

import { useEffect, useRef } from 'react';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface PerformanceMetrics {
  fcp: number;      // First Contentful Paint
  lcp: number;      // Largest Contentful Paint
  fid: number;      // First Input Delay
  cls: number;      // Cumulative Layout Shift
  ttfb: number;     // Time to First Byte
  memoryUsage: number;
}

export function PerformanceOptimizer() {
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const metric = entry.name;
          const value = entry.startTime;
          
          switch (metric) {
            case 'FCP':
              metricsRef.current.fcp = value;
              break;
            case 'LCP':
              metricsRef.current.lcp = value;
              break;
            case 'FID':
              metricsRef.current.fid = value;
              break;
            case 'CLS':
              metricsRef.current.cls = value;
              break;
          }

          analyticsService.trackEvent('performance_metric', {
            metric,
            value
          });
        }
      }).observe({ entryTypes: ['web-vital'] });
    }

    // Monitor Memory Usage
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        metricsRef.current.memoryUsage = 
          memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        if (metricsRef.current.memoryUsage > 0.9) {
          // Memory usage is high, trigger cleanup
          triggerCleanup();
        }
      }
    };

    const memoryInterval = setInterval(checkMemory, 30000);

    return () => clearInterval(memoryInterval);
  }, []);

  const triggerCleanup = () => {
    // Clear image cache
    if ('caches' in window) {
      caches.delete('image-cache');
    }

    // Clear unused event listeners
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  };

  return null;
} 