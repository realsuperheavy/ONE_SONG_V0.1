export interface Cache<T> {
  get: (key: string) => Promise<T | null>;
  set: (key: string, value: T, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  getAll: () => Promise<Map<string, T>>;
  clear: () => Promise<void>;
}

export class CacheImplementation<T> implements Cache<T> {
  private store = new Map<string, { value: T; expiry: number }>();

  async get(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: T, ttl = 3600000): Promise<void> {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getAll(): Promise<Map<string, T>> {
    const now = Date.now();
    const result = new Map<string, T>();
    
    for (const [key, item] of this.store.entries()) {
      if (item.expiry >= now) {
        result.set(key, item.value);
      } else {
        this.store.delete(key);
      }
    }
    
    return result;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
} 