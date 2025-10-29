type CacheEntry<V> = { value: V; expiresAt: number };

export class LRUCache<K, V> {
  private maxSize: number;
  private store: Map<K, CacheEntry<V>>;

  constructor(maxSize = 200) {
    this.maxSize = Math.max(1, maxSize);
    this.store = new Map();
  }

  get(key: K): V | undefined {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh LRU
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, ttlMs: number): void {
    const expiresAt = Date.now() + Math.max(0, ttlMs);
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expiresAt });
    if (this.store.size > this.maxSize) {
      // Evict least-recently-used
      const firstKey = this.store.keys().next().value as K | undefined;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
  }

  delete(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Singleton caches for API routes
export const apiCache = new LRUCache<string, any>(300);


