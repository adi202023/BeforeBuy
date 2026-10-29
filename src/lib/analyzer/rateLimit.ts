// Simple sliding-window in-memory rate limiter for serverless / edge Next.js API
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per IP

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const cleanIp = ip || "unknown-client";

  const record = ipMap.get(cleanIp);

  // Clean old entries periodically
  if (ipMap.size > 5000) {
    ipMap.forEach((val, key) => {
      if (val.resetAt < now) {
        ipMap.delete(key);
      }
    });
  }

  if (!record || record.resetAt < now) {
    ipMap.set(cleanIp, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetInSec: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
    resetInSec: Math.ceil((record.resetAt - now) / 1000),
  };
}
