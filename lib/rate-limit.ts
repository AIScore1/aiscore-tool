interface Counter {
  perMinute: number[];
  perDay: number[];
  perThirtyMin: number[];
}

const buckets = new Map<string, Counter>();

const MINUTE = 60_000;
const DAY = 24 * 60 * 60_000;
const THIRTY_MIN = 30 * 60_000;

export function rateLimitCheck(ip: string): {
  allowed: boolean;
  reason?: string;
  captchaRequired: boolean;
} {
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

export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
