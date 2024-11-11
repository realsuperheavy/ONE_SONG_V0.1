import { CacheConfig, CacheEntry } from './types';

export class Cache<T> {
  private store: Map<string, CacheEntry<T>>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.store = new Map();
    this.config = {
      maxSize: 1000,
      ttl: 3600,
      ...config
    };
  }

  async get(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    if (this.store.size >= (this.config.maxSize || 1000)) {
      // Remove oldest entry if cache is full
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ((ttl || this.config.ttl || 3600) * 1000)
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
} 