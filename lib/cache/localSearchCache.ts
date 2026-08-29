import type { CandidateGenerationResult } from "./searchCache";
import type { SearchCache } from "./searchCache";

/**
 * In-memory search result cache.
 *
 * For simplicity, we use a plain Map with lazy expiration cleanup.
 * In a production setting with multiple instances, this would be replaced
 * with a Redis-backed implementation.
 */
export class LocalSearchCache<T = CandidateGenerationResult> implements SearchCache<T> {
  private cache = new Map<string, {
    value: T;
    expiresAt: number; // timestamp in ms
  }>();

  private readonly defaultTtlSeconds: number;
  private readonly maxEntries: number;

  constructor(options: {
    defaultTtlSeconds?: number;
    maxEntries?: number;
  } = {}) {
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 20 * 60; // 20 minutes
    this.maxEntries = options.maxEntries ?? 500; // reasonable limit
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now >= entry.expiresAt) {
      // Expired - remove it
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: T, ttlSeconds: number = this.defaultTtlSeconds): Promise<void> {
    // Enforce max size by removing oldest entries if needed (simple LRU approximation)
    if (this.cache.size >= this.maxEntries) {
      // Remove the first entry (approximate LRU - could be improved)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Factory function to create a search cache instance.
 * In the future, this could read from environment variables to choose
 * between local memory and Redis implementations.
 */
export function createSearchCache<T = CandidateGenerationResult>(options?: {
  defaultTtlSeconds?: number;
  maxEntries?: number;
}) {
  return new LocalSearchCache<T>(options);
}
