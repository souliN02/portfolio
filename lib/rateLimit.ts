/**
 * A small in-memory sliding-window rate limiter for the API routes.
 *
 * On serverless hosting each warm instance keeps its own memory, so this is a
 * best-effort limit per instance, not a global guarantee. It stops casual abuse;
 * the real ceiling is the spend limit set on the API key itself.
 */

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the next request would be allowed (0 when ok) */
  retryAfter: number;
}

export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, number[]>();

  return function check(key: string, now = Date.now()): RateLimitResult {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return { ok: false, retryAfter: Math.max(1, Math.ceil((recent[0]! + windowMs - now) / 1000)) };
    }
    recent.push(now);
    hits.delete(key);
    hits.set(key, recent);
    // Drop the oldest keys so memory stays bounded (Map keeps insertion order)
    while (hits.size > maxKeys) {
      const oldest = hits.keys().next().value;
      if (oldest === undefined) break;
      hits.delete(oldest);
    }
    return { ok: true, retryAfter: 0 };
  };
}

/** Best guess at the caller's IP behind Vercel's proxy */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
