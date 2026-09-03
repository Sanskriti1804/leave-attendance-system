import type { NextFunction, Request, Response } from "express";
import { env } from "../../../env.js";

export type RateLimitResult = {
  count: number;
  resetAt: number;
};

/**
 * Interface for rate limit storage.
 * In a multi-instance production environment, implement this interface using Redis/Memcached.
 */
export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitResult> | RateLimitResult;
}

/**
 * In-memory sliding window rate limit store.
 * Suitable for single-instance / local deployments.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitResult>();
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (now >= value.resetAt) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1000);
    this.cleanupTimer.unref();
  }

  increment(key: string, windowMs: number): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now >= record.resetAt) {
      const newRecord: RateLimitResult = { count: 1, resetAt: now + windowMs };
      this.store.set(key, newRecord);
      return newRecord;
    }

    record.count += 1;
    return record;
  }

  clear(): void {
    this.store.clear();
  }
}

let activeStore: RateLimitStore = new MemoryRateLimitStore();

/**
 * Allows swapping the rate limiter store (e.g. RedisStore in multi-instance production).
 */
export function setRateLimitStore(store: RateLimitStore): void {
  activeStore = store;
}

export type RateLimitOptions = {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
};

export function rateLimit(options?: RateLimitOptions) {
  const windowMs = options?.windowMs ?? env.authRateLimitWindowMs;
  const max = options?.max ?? env.authRateLimitMax;
  const message = options?.message ?? "Too many requests, please try again later.";
  const keyGen =
    options?.keyGenerator ??
    ((req: Request) => {
      const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
      return `${req.baseUrl || ""}${req.path}:${ip}`;
    });

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGen(req);
      const now = Date.now();
      const { count, resetAt } = await activeStore.increment(key, windowMs);

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));
      res.setHeader("X-RateLimit-Reset", Math.ceil(resetAt / 1000));

      if (count > max) {
        const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
        res.setHeader("Retry-After", retryAfterSeconds);
        res.status(429).json({
          error: {
            code: "TOO_MANY_REQUESTS",
            message,
          },
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
