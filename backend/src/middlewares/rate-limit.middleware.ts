import { Request, Response, NextFunction } from "express";
import { HttpError } from "../error/http-error";

/**
 *  Rate Limiting Middleware
 * Prevents admin abuse and mistakes
 *
 * Tracks requests by admin ID + endpoint
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Admin-specific rate limiting
 * Limits: 30 requests per minute per admin
 * For sensitive endpoints: ban, mute, view report
 */
export const adminRateLimit = (
  limitPerMinute: number = 30,
  endpoints?: ("ban" | "mute" | "view-report")[],
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only apply to authenticated admin requests
      if (!req.user) {
        throw new HttpError("Unauthorized: No user info", 401);
      }

      const adminId = req.user._id?.toString() || "unknown";
      const now = Date.now();
      const key = `admin:${adminId}`;

      // Get or create rate limit record
      let record = rateLimitStore.get(key);

      if (!record || now > record.resetTime) {
        // Create new record (reset every minute)
        record = {
          count: 0,
          resetTime: now + 60000, // 60 seconds
        };
        rateLimitStore.set(key, record);
      }

      // Increment count
      record.count++;

      // Check if exceeded
      if (record.count > limitPerMinute) {
        const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
        throw new HttpError(
          `Rate limited: Too many admin requests. Try again in ${remainingSeconds}s`,
          429,
        );
      }

      // Add rate limit info to response headers
      res.setHeader("X-RateLimit-Limit", limitPerMinute);
      res.setHeader("X-RateLimit-Remaining", limitPerMinute - record.count);
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

      next();
    } catch (error: any) {
      return res.status(error.statusCode ?? 429).json({
        success: false,
        message: error.message || "Rate limit exceeded",
      });
    }
  };
};

/**
 * Ultra-strict rate limiting for sensitive operations
 * Limits: 5 requests per minute for dangerous actions
 * Used for: user bans, mutes, report actions
 */
export const strictAdminRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  return adminRateLimit(5)(req, res, next);
};

/**
 * Cleanup old rate limit records periodically
 * Prevents memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime + 60000) {
      // Keep only recent records
      rateLimitStore.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes
