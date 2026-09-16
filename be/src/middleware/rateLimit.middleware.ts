import type { RequestHandler } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export const createRateLimit = ({ windowMs, max, message }: RateLimitOptions): RequestHandler => {
  const entries = new Map<string, RateLimitEntry>();
  let requestsSinceCleanup = 0;

  return (req, res, next) => {
    const now = Date.now();
    requestsSinceCleanup += 1;
    if (requestsSinceCleanup >= 100) {
      for (const [key, entry] of entries) {
        if (entry.resetAt <= now) entries.delete(key);
      }
      requestsSinceCleanup = 0;
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = entries.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 1, resetAt: now + windowMs }
      : { count: current.count + 1, resetAt: current.resetAt };
    entries.set(key, entry);

    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(resetSeconds));

    if (entry.count > max) {
      res.setHeader('Retry-After', String(resetSeconds));
      res.status(429).json({ success: false, message, data: null });
      return;
    }
    next();
  };
};
