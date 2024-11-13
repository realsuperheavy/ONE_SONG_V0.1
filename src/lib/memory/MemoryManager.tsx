'use client';

import { useEffect, useRef } from 'react';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface MemoryThresholds {
  warning: number;
  critical: number;
}

interface CacheConfig {
  maxAge: number;
  maxItems: number;
}

export function MemoryManager() {
  const thresholds: MemoryThresholds = {
    warning: 0.7,  // 70% of available memory
    critical: 0.9  // 90% of available memory
  };

  const cacheConfig: CacheConfig = {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxItems: 100
  };

  const cache = useRef(new Map<string, { data: any; timestamp: number }>());

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        if (usage > thresholds.critical) {
          handleCriticalMemory();
        } else if (usage > thresholds.warning) {
          handleWarningMemory();
        }

        analyticsService.trackEvent('memory_usage', {
          usage: usage * 100,
          heapSize: memory.usedJSHeapSize
        });
      }
    };

    const interval = setInterval(checkMemory, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCriticalMemory = () => {
    // Clear all caches
    cache.current.clear();
    if ('caches' in window) {
      caches.keys().then(keys => 
        Promise.all(keys.map(key => caches.delete(key)))
      );
    }

    // Clear local storage items older than maxAge
    Object.keys(localStorage).forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '');
        if (Date.now() - item.timestamp > cacheConfig.maxAge) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Invalid JSON, skip item
      }
    });

    analyticsService.trackEvent('memory_critical', {
      action: 'cache_cleared'
    });
  };

  const handleWarningMemory = () => {
    // Clear old cache entries
    const now = Date.now();
    cache.current.forEach((value, key) => {
      if (now - value.timestamp > cacheConfig.maxAge) {
        cache.current.delete(key);
      }
    });

    // Limit cache size
    if (cache.current.size > cacheConfig.maxItems) {
      const entriesToDelete = Array.from(cache.current.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, cache.current.size - cacheConfig.maxItems);

      entriesToDelete.forEach(([key]) => cache.current.delete(key));
    }

    analyticsService.trackEvent('memory_warning', {
      action: 'cache_optimized',
      cacheSize: cache.current.size
    });
  };

  return null;
} 