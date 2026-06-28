import { logger } from '../../../core/logging';

interface CacheEntry {
  response: string;
  timestamp: number;
  model: string;
  ttlMs: number;
}

/**
 * Simple in-memory cache for AI responses.
 * Future: Could be backed by IndexedDB for persistence.
 */
export class AICache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): { response: string; model: string } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    logger.debug('AI cache hit', { key });
    return { response: entry.response, model: entry.model };
  }

  set(key: string, response: string, model: string, ttlMs = 3600000): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      model,
      ttlMs,
    });

    logger.debug('AI cache set', { key });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const aiCache = new AICache();
