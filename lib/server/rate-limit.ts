type Bucket = { count: number; resetAt: number }

// Use a global map so it survives hot reloads in dev and is shared across handlers.
const g = globalThis as unknown as { __rateLimiter?: Map<string, Bucket> }
if (!g.__rateLimiter) g.__rateLimiter = new Map<string, Bucket>()
const store = g.__rateLimiter

export type RateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: number
}

/**
 * Fixed-window in-memory rate limiter.
 * Not suitable for production across multiple instances; use Redis in prod.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = store.get(key)
  if (!bucket || now >= bucket.resetAt) {
    // start a fresh window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt }
  }
  bucket.count += 1
  store.set(key, bucket)
  return { ok: true, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt }
}

/** Test helper: clears state for a key or all keys. */
export function resetRateLimiter(key?: string) {
  if (!key) return store.clear()
  store.delete(key)
}
