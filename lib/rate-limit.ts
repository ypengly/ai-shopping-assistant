// In-memory fixed-window limiter. Fine for a single server process (local dev, one VPS).
// For multiple instances or serverless, swap the Map for Redis/Upstash behind the same functions.
type Bucket = { count: number; resetAt: number };

const globalForLimit = globalThis as unknown as { rateBuckets?: Map<string, Bucket> };
const buckets = (globalForLimit.rateBuckets ??= new Map<string, Bucket>());

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
