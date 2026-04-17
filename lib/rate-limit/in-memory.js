import { RateLimitError } from "../errors.js";

const SWEEP_THRESHOLD = 5000; // buckets before we sweep stale entries

export function createInMemoryRateLimiter({
  max = 10,
  windowMs = 60 * 60 * 1000,
} = {}) {
  /** @type {Map<string, number[]>} */
  const buckets = new Map();

  function check(key) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const hits = (buckets.get(key) || []).filter((t) => t > windowStart);

    if (hits.length >= max) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((hits[0] + windowMs - now) / 1000)
      );
      return { ok: false, remaining: 0, retryAfterSec };
    }

    hits.push(now);
    buckets.set(key, hits);

    if (buckets.size > SWEEP_THRESHOLD) sweep(buckets, windowStart);

    return { ok: true, remaining: max - hits.length, retryAfterSec: 0 };
  }

  function enforce(key) {
    const r = check(key);
    if (!r.ok) throw new RateLimitError(r.retryAfterSec);
    return r;
  }

  return { check, enforce, _buckets: buckets, config: { max, windowMs } };
}

function sweep(buckets, windowStart) {
  for (const [k, v] of buckets.entries()) {
    const kept = v.filter((t) => t > windowStart);
    if (kept.length === 0) buckets.delete(k);
    else buckets.set(k, kept);
  }
}


export const defaultLimiter = createInMemoryRateLimiter({
  max: Number(process.env.RATE_LIMIT_MAX ?? 10),
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60 * 60 * 1000),
});

/**
 * Extracts a stable per-client key from a request. Prefers x-forwarded-for
 * (Vercel sets it), falls back to x-real-ip, then "unknown".
 *
 * @param {Request} req
 */
export function clientKey(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
