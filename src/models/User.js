import { getDatabase } from '../config/database.js';

/**
 * Data‑access layer for the `users` table.
 *
 * Every method is a thin wrapper around a SQL query — no business logic here.
 * Business rules live in the service layer.
 */
const User = {
  /**
   * Insert a new user row and return the created user (without password_hash).
   */
  create({ email, passwordHash, name, role = 'viewer' }) {
    const db = getDatabase();
    db.run(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES (?, ?, ?, ?)`,
      [email, passwordHash, name, role],
    );
    // sql.js doesn't return lastInsertRowid directly; query for it
    const row = db.exec('SELECT last_insert_rowid() as id');
    const id = row[0].values[0][0];
    return this.findById(id);
  },

  /**
   * Find a user by primary key (excludes soft‑deleted).
   */
  findById(id) {
    const db = getDatabase();
    const result = db.exec(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    return this._rowToObject(result);
  },

  /**
   * Find a user by email (used during login — includes password_hash).
   */
  findByEmail(email) {
    const db = getDatabase();
    const result = db.exec(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email],
    );
    return this._rowToObject(result);
  },

  /**
   * List users with pagination (excludes soft‑deleted).
   */
  findAll({ page = 1, limit = 20 } = {}) {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    const countResult = db.exec(
      'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL',
    );
    const total = countResult[0].values[0][0];

    const result = db.exec(
      `SELECT id, email, name, role, status, created_at, updated_at
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    return {
      items: this._rowsToArray(result),
      total,
    };
  },

  /**
   * Update a user's role.
   */
  updateRole(id, role) {
    const db = getDatabase();
    db.run(
      `UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?`,
      [role, id],
    );
    return this.findById(id);
  },

  /**
   * Update a user's status (active / inactive).
   */
  updateStatus(id, status) {
    const db = getDatabase();
    db.run(
      `UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [status, id],
    );
    return this.findById(id);
  },

  /**
   * Soft‑delete a user.
   */
  softDelete(id) {
    const db = getDatabase();
    db.run(
      `UPDATE users SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [id],
    );
  },

  // ── internal helpers ──────────────────────────────────────────

  /**
   * Convert a sql.js result (array of columns + values) to a single object.
   */
  _rowToObject(result) {
    if (!result || result.length === 0 || result[0].values.length === 0) {
      return null;
    }
    const columns = result[0].columns;
    const values = result[0].values[0];
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = values[i];
    });
    return obj;
  },

  /**
   * Convert a sql.js result to an array of objects.
   */
  _rowsToArray(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map((row) => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  },
};

export default User;
