import config from '../config/index.js';

/**
 * Global error‑handling middleware.
 *
 * Catches every error that passes through `next(err)` and sends a
 * consistent JSON response.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // default to 500 if no status code was set
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  // log unexpected errors in dev
  if (!isOperational) {
    console.error('💥 Unexpected error:', err);
  }

  const response = {
    success: false,
    error: {
      code: statusCode,
      message: isOperational
        ? err.message
        : 'Something went wrong. Please try again later.',
    },
  };

  // attach field‑level validation details when present
  if (err.details) {
    response.error.details = err.details;
  }

  // include stack trace only in development
  if (config.nodeEnv === 'development' && !isOperational) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
