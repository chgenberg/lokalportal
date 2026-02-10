/**
 * Simple in-memory rate limiter. Use for low-traffic or single-instance apps.
 * For multi-instance production, use Redis or similar.
 */

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function prune() {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) store.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = WINDOW_MS
): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  if (store.size > 10000) prune();

  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }
  if (entry.resetAt < now) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
    return { limited: false };
  }
  entry.count++;
  if (entry.count > maxRequests) {
    return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { limited: false };
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return ip;
}
