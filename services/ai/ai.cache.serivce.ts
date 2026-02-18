/**
 * AI Cache Service
 * Caches AI responses to reduce API calls and costs
 */

// ============================================
// TYPES
// ============================================

interface CacheEntry {
  key: string;
  value: string;
  expiresAt: Date;
}

// ============================================
// CACHE CONFIGURATIONS
// ============================================

export const AI_CACHE_CONFIG = {
  jobParsing: {
    ttl: 86400 * 7, // 7 days
    keyPrefix: "ai:jd:",
  },
  embeddings: {
    ttl: 86400 * 30, // 30 days
    keyPrefix: "ai:emb:",
  },
  messages: {
    ttl: 3600, // 1 hour
    keyPrefix: "ai:msg:",
  },
  insights: {
    ttl: 86400, // 1 day
    keyPrefix: "ai:ins:",
  },
  summary: {
    ttl: 86400 * 7, // 7 days
    keyPrefix: "ai:sum:",
  },
};

// ============================================
// IN-MEMORY CACHE
// ============================================

const memoryCache = new Map<string, CacheEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = new Date();
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt < now) {
        memoryCache.delete(key);
      }
    }
  }, 60000);
}

// ============================================
// CACHE FUNCTIONS
// ============================================

/**
 * Get value from cache
 */
export async function getCached<T>(
  cacheType: keyof typeof AI_CACHE_CONFIG,
  identifier: string
): Promise<T | null> {
  const config = AI_CACHE_CONFIG[cacheType];
  const key = `${config.keyPrefix}${identifier}`;

  const memEntry = memoryCache.get(key);
  if (memEntry && memEntry.expiresAt > new Date()) {
    try {
      return JSON.parse(memEntry.value) as T;
    } catch {
      memoryCache.delete(key);
    }
  }

  return null;
}

/**
 * Set value in cache
 */
export async function setCached<T>(
  cacheType: keyof typeof AI_CACHE_CONFIG,
  identifier: string,
  value: T
): Promise<void> {
  const config = AI_CACHE_CONFIG[cacheType];
  const key = `${config.keyPrefix}${identifier}`;
  const expiresAt = new Date(Date.now() + config.ttl * 1000);
  const serializedValue = JSON.stringify(value);

  memoryCache.set(key, {
    key,
    value: serializedValue,
    expiresAt,
  });
}

/**
 * Invalidate cache entry
 */
export async function invalidateCache(
  cacheType: keyof typeof AI_CACHE_CONFIG,
  identifier: string
): Promise<void> {
  const config = AI_CACHE_CONFIG[cacheType];
  const key = `${config.keyPrefix}${identifier}`;
  memoryCache.delete(key);
}

/**
 * Cached AI call wrapper
 */
export async function cachedAICall<T>(
  cacheType: keyof typeof AI_CACHE_CONFIG,
  identifier: string,
  generator: () => Promise<T>
): Promise<T> {
  const cached = await getCached<T>(cacheType, identifier);
  if (cached) {
    return cached;
  }

  const result = await generator();
  await setCached(cacheType, identifier, result);

  return result;
}

/**
 * Get cache stats
 */
export function getCacheStats(): {
  memorySize: number;
  memoryCacheKeys: string[];
} {
  return {
    memorySize: memoryCache.size,
    memoryCacheKeys: Array.from(memoryCache.keys()),
  };
}