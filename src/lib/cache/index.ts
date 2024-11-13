'use client';

import { analyticsService } from '@/lib/firebase/services/analytics';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';

interface CacheConfig {
  maxAge: number;
  maxItems: number;
  namespace: string;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class CacheManager {
  private cache: Map<string, CacheItem<any>>;
  private config: CacheConfig;
  private performanceMonitor: PerformanceMetricsCollector;

  constructor(config?: Partial<CacheConfig>) {
    this.cache = new Map();
    this.config = {
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxItems: 100,
      namespace: 'app-cache',
      ...config
    };
    this.performanceMonitor = new PerformanceMetricsCollector();
  }

  async set<T>(key: string, data: T, maxAge?: number): Promise<void> {
    this.performanceMonitor.startOperation('cacheSet');
    
    try {
      const timestamp = Date.now();
      const expiresAt = timestamp + (maxAge || this.config.maxAge);

      // Ensure we don't exceed max items
      if (this.cache.size >= this.config.maxItems) {
        this.evictOldest();
      }

      const cacheKey = this.getCacheKey(key);
      this.cache.set(cacheKey, { data, timestamp, expiresAt });

      // Persist to localStorage if available
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp,
          expiresAt
        }));
      }

      this.performanceMonitor.endOperation('cacheSet');
      analyticsService.trackEvent('cache_set', {
        key: cacheKey,
        expiresIn: this.config.maxAge
      });
    } catch (error) {
      this.performanceMonitor.trackError('cacheSet');
      analyticsService.trackError(error as Error, {
        context: 'cache_set',
        key
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    this.performanceMonitor.startOperation('cacheGet');
    
    try {
      const cacheKey = this.getCacheKey(key);
      let item = this.cache.get(cacheKey);

      // Check localStorage if not in memory
      if (!item && typeof window !== 'undefined') {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          item = JSON.parse(stored);
          this.cache.set(cacheKey, item);
        }
      }

      if (!item || Date.now() > item.expiresAt) {
        this.delete(key);
        this.performanceMonitor.endOperation('cacheGet');
        return null;
      }

      this.performanceMonitor.endOperation('cacheGet');
      analyticsService.trackEvent('cache_hit', {
        key: cacheKey,
        age: Date.now() - item.timestamp
      });

      return item.data;
    } catch (error) {
      this.performanceMonitor.trackError('cacheGet');
      analyticsService.trackError(error as Error, {
        context: 'cache_get',
        key
      });
      return null;
    }
  }

  delete(key: string): void {
    const cacheKey = this.getCacheKey(key);
    this.cache.delete(cacheKey);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cacheKey);
    }
  }

  clear(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.config.namespace))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  private getCacheKey(key: string): string {
    return `${this.config.namespace}:${key}`;
  }

  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    const oldest = entries.reduce((a, b) => 
      a[1].timestamp < b[1].timestamp ? a : b
    );
    this.delete(oldest[0]);
  }

  private cleanup(): void {
    this.performanceMonitor.startOperation('cacheCleanup');
    
    try {
      // Clear expired items
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiresAt) {
          this.delete(key);
        }
      }

      // Clear memory if too much is used
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
          this.clear();
        }
      }
    } finally {
      this.performanceMonitor.endOperation('cacheCleanup');
    }
  }
} 