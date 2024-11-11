export interface CacheConfig {
  name: string;
  maxSize?: number;
  ttl?: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
} 