// CIRCULAR: storage -> cache -> storage
import type { CacheService } from "./cache.js";

export interface StorageService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
}

export class InMemoryStorage implements StorageService {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private cache?: CacheService;

  constructor(cache?: CacheService) {
    this.cache = cache;
  }

  async get(key: string): Promise<string | null> {
    if (this.cache) {
      const cached = await this.cache.get(key);
      if (cached !== null) return cached;
    }
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    });
    if (this.cache) {
      await this.cache.set(key, value, ttl);
    }
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async keys(pattern?: string): Promise<string[]> {
    const all = Array.from(this.store.keys());
    if (!pattern) return all;
    const regex = new RegExp(pattern.replace("*", ".*"));
    return all.filter((k) => regex.test(k));
  }

  // Unused
  async clear(): Promise<void> {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const storageService = new InMemoryStorage();
// Unused
export type StorageDriver = "memory" | "redis" | "sqlite" | "s3";
export const DEFAULT_TTL = 3600;
