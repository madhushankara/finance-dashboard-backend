import AppError from '../utils/AppError.js';

/**
 * Middleware factory: restrict access to one or more roles.
 *
 * Usage:  router.get('/admin-only', authenticate, authorize('admin'), handler)
 *         router.get('/analysts',   authenticate, authorize('analyst', 'admin'), handler)
 */
export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
          403,
        ),
      );
    }

    next();
  };
}
