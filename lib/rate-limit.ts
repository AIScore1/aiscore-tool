/**
 * Rate limiting for the public audit endpoint.
 *
 * Strategy:
 * - In production (Vercel), use Upstash Redis for cross-instance accuracy.
 *   The `Map`-based in-memory approach doesn't work across serverless
 *   function instances — each cold start gets a fresh Map and attackers
 *   can bypass limits by hitting different instances.
 * - In local dev (no Upstash creds), fall back to in-memory so the
 *   endpoint still works for testing.
 *
 * Public limits (per IP):
 * - 3 requests per minute (hard limit)
 * - 20 requests per day (hard limit)
 * - Captcha required once a 4th request lands within a 30-minute window
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  captchaRequired: boolean;
}

// -- Upstash path (production) --------------------------------------------

let cachedLimiters: { perMin: Ratelimit; perDay: Ratelimit; per30Min: Ratelimit } | null = null;

function getUpstashLimiters() {
  if (cachedLimiters) return cachedLimiters;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  const redis = Redis.fromEnv();
  cachedLimiters = {
    perMin: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 m'),
      prefix: 'aiscore:ratelimit:min',
      analytics: false,
    }),
    perDay: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 d'),
      prefix: 'aiscore:ratelimit:day',
      analytics: false,
    }),
    per30Min: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '30 m'),
      prefix: 'aiscore:ratelimit:30min',
      analytics: false,
    }),
  };
  return cachedLimiters;
}

async function rateLimitCheckUpstash(
  ip: string,
  limiters: ReturnType<typeof getUpstashLimiters>
): Promise<RateLimitResult> {
  if (!limiters) {
    return { allowed: true, captchaRequired: false };
  }
  const [minResult, dayResult, halfHourResult] = await Promise.all([
    limiters.perMin.limit(ip),
    limiters.perDay.limit(ip),
    limiters.per30Min.limit(ip),
  ]);

  if (!minResult.success) {
    return { allowed: false, reason: 'Rate limit: 3 audits per minute', captchaRequired: false };
  }
  if (!dayResult.success) {
    return { allowed: false, reason: 'Rate limit: 20 audits per day', captchaRequired: false };
  }
  // 30-min window has been consumed — the next one would block — so request captcha.
  const captchaRequired = !halfHourResult.success || halfHourResult.remaining === 0;
  return { allowed: true, captchaRequired };
}

// -- In-memory fallback (local dev) ---------------------------------------

interface Counter {
  perMinute: number[];
  perDay: number[];
  perThirtyMin: number[];
}

const buckets = new Map<string, Counter>();
const MINUTE = 60_000;
const DAY = 24 * 60 * 60_000;
const THIRTY_MIN = 30 * 60_000;

function rateLimitCheckInMemory(ip: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { perMinute: [], perDay: [], perThirtyMin: [] };
  bucket.perMinute = bucket.perMinute.filter((t) => now - t < MINUTE);
  bucket.perDay = bucket.perDay.filter((t) => now - t < DAY);
  bucket.perThirtyMin = bucket.perThirtyMin.filter((t) => now - t < THIRTY_MIN);

  if (bucket.perMinute.length >= 3) {
    return { allowed: false, reason: 'Rate limit: 3 audits per minute', captchaRequired: false };
  }
  if (bucket.perDay.length >= 20) {
    return { allowed: false, reason: 'Rate limit: 20 audits per day', captchaRequired: false };
  }
  const captchaRequired = bucket.perThirtyMin.length >= 3;

  bucket.perMinute.push(now);
  bucket.perDay.push(now);
  bucket.perThirtyMin.push(now);
  buckets.set(ip, bucket);

  return { allowed: true, captchaRequired };
}

// -- Public API -----------------------------------------------------------

export async function rateLimitCheck(ip: string): Promise<RateLimitResult> {
  const limiters = getUpstashLimiters();
  if (limiters) {
    try {
      return await rateLimitCheckUpstash(ip, limiters);
    } catch (err) {
      // If Upstash hiccups, fail open — better to serve a few extra requests than
      // 503 the whole endpoint. The in-memory fallback at least catches obvious abuse.
      console.error('Upstash rate limit failed, falling back to in-memory:', err);
      return rateLimitCheckInMemory(ip);
    }
  }
  return rateLimitCheckInMemory(ip);
}

export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
