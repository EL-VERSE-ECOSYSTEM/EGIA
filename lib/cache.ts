type Entry<T> = { value: T; expiresAt: number; tags: string[] };

class MemoryCache {
  private store = new Map<string, Entry<unknown>>();
  private tagIndex = new Map<string, Set<string>>();
  private inFlightPromises = new Map<string, Promise<any>>();

  constructor() {
    if (typeof setInterval !== "undefined") {
      const t = setInterval(() => this.cleanup(), 5 * 60_000);
      if (t.unref) t.unref();
    }
  }

  set<T>(key: string, value: T, ttlSeconds: number, tags: string[] = []) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000, tags });
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  get<T>(key: string): T | null {
    const e = this.store.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.delete(key);
      return null;
    }
    return e.value as T;
  }

  ttl(key: string): number {
    const e = this.store.get(key);
    if (!e) return -1;
    const r = Math.ceil((e.expiresAt - Date.now()) / 1000);
    return r > 0 ? r : -1;
  }

  delete(key: string) {
    const e = this.store.get(key);
    if (e && e.tags) {
      for (const tag of e.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    this.store.delete(key);
  }

  invalidateTag(tag: string) {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      for (const key of Array.from(keys)) {
        this.delete(key);
      }
      this.tagIndex.delete(tag);
    }
  }

  invalidateTags(tags: string[]) {
    for (const tag of tags) {
      this.invalidateTag(tag);
    }
  }

  async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 300,
    tags: string[] = []
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    if (this.inFlightPromises.has(key)) {
      return this.inFlightPromises.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const freshData = await fetcher();
        this.set(key, freshData, ttlSeconds, tags);
        return freshData;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, promise);
    return promise;
  }

  async warmUpCache(
    entries: Array<{ key: string; fetcher: () => Promise<any>; ttlSeconds?: number; tags?: string[] }>
  ) {
    for (const entry of entries) {
      try {
        await this.getCachedData(entry.key, entry.fetcher, entry.ttlSeconds ?? 300, entry.tags ?? []);
      } catch (err) {
        console.warn(`Cache warmup failed for key ${entry.key}:`, err);
      }
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now > v.expiresAt) {
        this.delete(k);
      }
    }
  }
}

const g = globalThis as unknown as { __cache?: MemoryCache };
export const cache = g.__cache ?? new MemoryCache();
if (process.env.NODE_ENV !== "production") g.__cache = cache;

export function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300,
  tags: string[] = []
): Promise<T> {
  return cache.getCachedData(key, fetcher, ttlSeconds, tags);
}

export function invalidateTag(tag: string) {
  cache.invalidateTag(tag);
}

export function invalidateTags(tags: string[]) {
  cache.invalidateTags(tags);
}

export function invalidateCacheKey(key: string) {
  cache.delete(key);
}

export function warmUpCache(
  entries: Array<{ key: string; fetcher: () => Promise<any>; ttlSeconds?: number; tags?: string[] }>
) {
  return cache.warmUpCache(entries);
}
