import { cache } from "./cache";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // seconds
};

export function rateLimit(
  key: string,
  max: number,
  windowSeconds: number
): RateLimitResult {
  const cacheKey = `rl:${key}`;
  const now = Date.now();

  let rec = cache.get<{ count: number; resetAt: number }>(cacheKey);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + windowSeconds * 1000 };
  }

  if (rec.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((rec.resetAt - now) / 1000),
    };
  }

  rec.count++;
  cache.set(cacheKey, rec, Math.ceil((rec.resetAt - now) / 1000));

  return {
    allowed: true,
    remaining: max - rec.count,
    retryAfter: Math.ceil((rec.resetAt - now) / 1000),
  };
}
