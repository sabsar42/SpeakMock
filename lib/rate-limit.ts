const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Vercel serverless instances are short-lived and can recycle between requests,
// so this in-memory limiter is a best-effort first line of defense, not a hard
// guarantee — it resets whenever a new instance is served. Good enough for a
// single-operator admin login; a shared store (e.g. Upstash) would be needed
// for a hard guarantee across instances.
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_ATTEMPTS;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
