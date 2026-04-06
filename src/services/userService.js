import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const userService = {
  /**
   * List all users (admin only), paginated.
   */
  listUsers({ page, limit }) {
    return User.findAll({ page, limit });
  },

  /**
   * Get a single user by ID.
   */
  getUser(id) {
    const user = User.findById(id);
    if (!user) throw new AppError('User not found.', 404);

    const { password_hash, deleted_at, ...safe } = user;
    return safe;
  },

  /**
   * Change a user's role.
   * Prevents admins from demoting themselves.
   */
  updateRole(targetId, newRole, requestingUser) {
    const target = User.findById(targetId);
    if (!target) throw new AppError('User not found.', 404);

    // prevent self‑demotion — an admin shouldn't accidentally lock themselves out
    if (target.id === requestingUser.id && newRole !== 'admin') {
      throw new AppError('You cannot change your own role.', 400);
    }

    const updated = User.updateRole(targetId, newRole);
    const { password_hash, deleted_at, ...safe } = updated;
    return safe;
  },

  /**
   * Activate or deactivate a user.
   */
  updateStatus(targetId, newStatus, requestingUser) {
    const target = User.findById(targetId);
    if (!target) throw new AppError('User not found.', 404);

    if (target.id === requestingUser.id) {
      throw new AppError('You cannot deactivate your own account.', 400);
    }

    const updated = User.updateStatus(targetId, newStatus);
    const { password_hash, deleted_at, ...safe } = updated;
    return safe;
  },

  /**
   * Soft‑delete a user.
   */
  deleteUser(targetId, requestingUser) {
    const target = User.findById(targetId);
    if (!target) throw new AppError('User not found.', 404);

    if (target.id === requestingUser.id) {
      throw new AppError('You cannot delete your own account.', 400);
    }

    User.softDelete(targetId);
  },
};

export default userService;
