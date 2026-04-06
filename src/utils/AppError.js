/**
 * Custom operational error.
 * All errors thrown with this class are treated as "expected" errors
 * (bad input, not found, unauthorized, etc.) and get a clean JSON response.
 */
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details; // optional field‑level validation info
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
