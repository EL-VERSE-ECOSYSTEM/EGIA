type CacheEntry<T> = {
  data: T
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry<any>>()

/**
 * A custom, high-performance in-memory caching system with TTL (Time To Live).
 * Optimizes database queries and external requests by returning cached data.
 */
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300 // default 5 minutes
): Promise<T> {
  const now = Date.now()
  const cached = memoryCache.get(key)

  if (cached && now < cached.expiresAt) {
    return cached.data as T
  }

  // Fetch fresh data
  const data = await fetchFn()

  memoryCache.set(key, {
    data,
    expiresAt: now + (ttlSeconds * 1000)
  })

  return data
}

/**
 * Invalidates a specific cache entry.
 */
export function invalidateCache(key: string): void {
  memoryCache.delete(key)
}

/**
 * Clears all cache entries.
 */
export function clearCache(): void {
  memoryCache.clear()
}
