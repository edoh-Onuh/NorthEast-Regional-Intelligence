import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** True when Upstash isn't configured and the check was skipped (fail-open). */
  skipped: boolean;
}

let warnedMissingConfig = false;

function buildLimiter(prefix: string, tokens: number, windowSeconds: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warnedMissingConfig) {
       
      console.warn(
        "[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is disabled (fail-open). Configure Upstash for production."
      );
      warnedMissingConfig = true;
    }
    return null;
  }
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(tokens, `${windowSeconds} s`),
    prefix: `ratelimit:${prefix}`,
    analytics: true,
  });
}

// Generous general-page limit (per-IP): mitigates scraping/DoS on server-rendered pages.
const pageLimiter = buildLimiter("page", 120, 60);
// Strict limit for the protected ingestion endpoint: it's cron-triggered, so
// legitimate traffic is ~1 request per scheduled run.
const ingestLimiter = buildLimiter("ingest", 5, 60);

async function check(limiter: Ratelimit | null, identifier: string): Promise<RateLimitResult> {
  if (!limiter) return { success: true, limit: 0, remaining: 0, skipped: true };
  const { success, limit, remaining } = await limiter.limit(identifier);
  return { success, limit, remaining, skipped: false };
}

export function checkPageRateLimit(ip: string): Promise<RateLimitResult> {
  return check(pageLimiter, ip);
}

export function checkIngestRateLimit(ip: string): Promise<RateLimitResult> {
  return check(ingestLimiter, ip);
}
