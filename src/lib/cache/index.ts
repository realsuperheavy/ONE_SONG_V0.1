import { CacheConfig, CacheEntry } from './types';

export class Cache<T> {
  private cache: Map<string, T>;
  private maxSize: number;

  constructor(options: { maxSize?: number }) {
    this.maxSize = options.maxSize ?? 100;
    this.cache = new Map();
  }

  async set(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  async getLatest(): Promise<T | null> {
    const entries = Array.from(this.cache.entries());
    return entries.length > 0 ? entries[entries.length - 1][1] : null;
  }
}

export const createCache = <T>(config: CacheConfig) => new Cache<T>(config); 