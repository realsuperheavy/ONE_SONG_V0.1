import { CacheConfig, CacheEntry } from './types';

export class Cache<T> {
  private cache: Map<string, { value: T; timestamp: number }>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = config;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  private evictOldest(): void {
    const oldest = [...this.cache.entries()]
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
    if (oldest) {
      this.cache.delete(oldest[0]);
    }
  }
}

export const createCache = <T>(config: CacheConfig) => new Cache<T>(config); 