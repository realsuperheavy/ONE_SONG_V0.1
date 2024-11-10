interface CacheConfig {
  maxSize?: number;
  ttl?: number;
}

export class Cache<T> {
  private cache: Map<string, { value: T; expires: number }>;
  private maxSize: number;
  private ttl: number;

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.maxSize = config.maxSize || 1000;
    this.ttl = config.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  set(key: string, value: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl || this.ttl)
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  async getValues(): Promise<T[]> {
    return Array.from(this.cache.values()).map(item => item.value);
  }

  async getAll(): Promise<Map<string, T>> {
    const entries = Array.from(this.cache.entries()).map(
      ([key, item]) => [key, item.value] as [string, T]
    );
    return new Map(entries);
  }
}