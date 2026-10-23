type Entry<T> = { value: T; expiresAt: number };

class MemoryCache {
  private store = new Map<string, Entry<unknown>>();

  constructor() {
    if (typeof setInterval !== "undefined") {
      const t = setInterval(() => this.cleanup(), 5 * 60_000);
      if (t.unref) t.unref();
    }
  }

  set<T>(key: string, value: T, ttlSeconds: number) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  get<T>(key: string): T | null {
    const e = this.store.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.store.delete(key);
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
    this.store.delete(key);
  }

  private cleanup() {
    const now = Date.now();
    for (const [k, v] of this.store) if (now > v.expiresAt) this.store.delete(k);
  }
}

const g = globalThis as unknown as { __cache?: MemoryCache };
export const cache = g.__cache ?? new MemoryCache();
if (process.env.NODE_ENV !== "production") g.__cache = cache;
