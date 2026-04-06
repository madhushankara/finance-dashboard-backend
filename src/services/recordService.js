import Record from '../models/Record.js';
import { getDatabase } from '../config/database.js';
import AppError from '../utils/AppError.js';

const recordService = {
  /**
   * Create a new financial record.
   */
  create(data, userId) {
    const record = Record.create({
      userId,
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: data.date,
      description: data.description,
    });

    // audit trail
    this._audit(userId, 'CREATE', 'record', record.id);

    return record;
  },

  /**
   * Get a single record by ID.
   */
  getById(id) {
    const record = Record.findById(id);
    if (!record) throw new AppError('Record not found.', 404);
    return record;
  },

  /**
   * List records with filters and pagination.
   */
  list(filters) {
    return Record.findAll(filters);
  },

  /**
   * Update a record's fields.
   */
  update(id, fields, userId) {
    const existing = Record.findById(id);
    if (!existing) throw new AppError('Record not found.', 404);

    const updated = Record.update(id, fields);
    this._audit(userId, 'UPDATE', 'record', id);
    return updated;
  },

  /**
   * Soft‑delete a record.
   */
  delete(id, userId) {
    const existing = Record.findById(id);
    if (!existing) throw new AppError('Record not found.', 404);

    Record.softDelete(id);
    this._audit(userId, 'DELETE', 'record', id);
  },

  // ── private ───────────────────────────────────────────────────

  _audit(userId, action, resource, resourceId) {
    try {
      const db = getDatabase();
      db.run(
        `INSERT INTO audit_log (user_id, action, resource, resource_id)
         VALUES (?, ?, ?, ?)`,
        [userId, action, resource, resourceId],
      );
    } catch {
      // audit logging should never break the main flow
      console.error('Failed to write audit log entry.');
    }
  },
};

export default recordService;
