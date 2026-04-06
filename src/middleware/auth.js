import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';

/**
 * Middleware: verify the JWT in the Authorization header and attach the
 * authenticated user to `req.user`.
 */
export function authenticate(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please provide a valid token.', 401));
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    if (user.status !== 'active') {
      return next(new AppError('Your account has been deactivated. Contact an admin.', 403));
    }

    if (user.deleted_at) {
      return next(new AppError('Your account has been deleted.', 403));
    }

    // attach a clean user object (no password hash)
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token.', 401));
  }
}
