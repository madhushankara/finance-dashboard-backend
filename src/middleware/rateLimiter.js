import rateLimit from 'express-rate-limit';

/**
 * Stricter rate limiter for authentication endpoints to prevent brute‑force.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                  // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 429,
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
  },
});

/**
 * General API rate limiter — more permissive.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 429,
      message: 'Rate limit exceeded. Please slow down.',
    },
  },
});
