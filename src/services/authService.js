import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const SALT_ROUNDS = 10;

const authService = {
  /**
   * Register a new user.  Hashes the password, creates the DB row,
   * and returns a JWT + user profile.
   */
  async register({ email, password, name, role }) {
    // check for duplicate email
    const existing = User.findByEmail(email);
    if (existing) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = User.create({ email, passwordHash, name, role: role || 'viewer' });

    const token = this._signToken(user.id);
    return { token, user: this._sanitize(user) };
  },

  /**
   * Authenticate a user by email + password.
   * Returns a JWT and the user profile on success.
   */
  async login({ email, password }) {
    const user = User.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('Your account is inactive. Contact an admin.', 403);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = this._signToken(user.id);
    return { token, user: this._sanitize(user) };
  },

  /**
   * Return the profile of the currently authenticated user.
   */
  getProfile(userId) {
    const user = User.findById(userId);
    if (!user) throw new AppError('User not found.', 404);
    return this._sanitize(user);
  },

  // ── private helpers ───────────────────────────────────────────

  _signToken(userId) {
    return jwt.sign({ id: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  },

  _sanitize(user) {
    const { password_hash, deleted_at, ...safe } = user;
    return safe;
  },
};

export default authService;
