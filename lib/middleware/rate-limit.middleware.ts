/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
 */

import { NextResponse } from 'next/server';

interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (replace with Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

// Predefined rate limit configurations
export const RATE_LIMITS = {
  /** Standard read operations */
  READ: { limit: 1000, windowMs: 3600000 }, // 1000/hour
  /** Write operations */
  WRITE: { limit: 100, windowMs: 3600000 }, // 100/hour
  /** AI-powered endpoints */
  AI: { limit: 50, windowMs: 3600000 }, // 50/hour
  /** Authentication endpoints */
  AUTH: { limit: 20, windowMs: 900000 }, // 20 per 15 minutes
  /** Batch operations */
  BATCH: { limit: 20, windowMs: 3600000 }, // 20/hour
} as const;

/**
 * Get client identifier for rate limiting
 */
function getClientId(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp}`;
  }

  return 'ip:unknown';
}

/**
 * Check rate limit and return result
 */
export function checkRateLimit(
  req: Request,
  config: RateLimitConfig,
  userId?: string
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
} {
  const clientId = getClientId(req, userId);
  const now = Date.now();
  const key = `${clientId}:${config.limit}:${config.windowMs}`;

  let entry = rateLimitStore.get(key);

  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  const remaining = Math.max(0, config.limit - entry.count - 1);
  const allowed = entry.count < config.limit;

  if (allowed) {
    entry.count++;
    rateLimitStore.set(key, entry);
  }

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    limit: config.limit,
  };
}

/**
 * Rate limit response with proper headers
 */
export function rateLimitResponse(resetAt: number, limit: number): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
    },
    { status: 429 }
  );

  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', '0');
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  response.headers.set('Retry-After', String(Math.ceil((resetAt - Date.now()) / 1000)));

  return response;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetAt: number,
  limit: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  return response;
}

/**
 * Rate limit wrapper for API handlers
 */
export async function withRateLimit<T>(
  req: Request,
  config: RateLimitConfig,
  handler: () => Promise<NextResponse>,
  userId?: string
): Promise<NextResponse> {
  const result = checkRateLimit(req, config, userId);

  if (!result.allowed) {
    return rateLimitResponse(result.resetAt, result.limit);
  }

  const response = await handler();
  return addRateLimitHeaders(response, result.remaining, result.resetAt, result.limit);
}
