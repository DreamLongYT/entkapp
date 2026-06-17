// CIRCULAR: cache -> storage -> cache
import type { StorageService } from "./storage.js";

export interface CacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  invalidate(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

export class LRUCache implements CacheService {
  private cache = new Map<string, { value: string; hits: number; expiresAt?: number }>();
  private storage?: StorageService;

  constructor(
    private maxSize: number = 1000,
    storage?: StorageService
  ) {
    this.storage = storage;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      // Fallback to storage – CIRCULAR call
      if (this.storage) return this.storage.get(key);
      return null;
    }
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    entry.hits++;
    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (this.cache.size >= this.maxSize) {
      // Evict least-recently-used
      const lru = [...this.cache.entries()].sort((a, b) => a[1].hits - b[1].hits)[0];
      if (lru) this.cache.delete(lru[0]);
    }
    this.cache.set(key, { value, hits: 0, expiresAt: ttl ? Date.now() + ttl * 1000 : undefined });
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace("*", ".*"));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) this.cache.delete(key);
    }
  }

  // Unused
  stats(): { size: number; maxSize: number; hitRate: number } {
    const entries = [...this.cache.values()];
    const totalHits = entries.reduce((s, e) => s + e.hits, 0);
    return { size: this.cache.size, maxSize: this.maxSize, hitRate: totalHits / Math.max(1, entries.length) };
  }
}

export const cacheService = new LRUCache();
// Unused
export type CacheStrategy = "lru" | "lfu" | "fifo" | "random";
export const CACHE_MISS = Symbol("CACHE_MISS");
