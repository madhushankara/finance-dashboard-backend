import { getDatabase } from '../config/database.js';

/**
 * Data‑access layer for the `records` (financial entries) table.
 */
const Record = {
  /**
   * Insert a new financial record.
   */
  create({ userId, amount, type, category, date, description }) {
    const db = getDatabase();
    db.run(
      `INSERT INTO records (user_id, amount, type, category, date, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, amount, type, category, date, description || null],
    );
    const row = db.exec('SELECT last_insert_rowid() as id');
    const id = row[0].values[0][0];
    return this.findById(id);
  },

  /**
   * Find a record by ID (excludes soft‑deleted).
   */
  findById(id) {
    const db = getDatabase();
    const result = db.exec(
      'SELECT * FROM records WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    return this._rowToObject(result);
  },

  /**
   * List records with optional filters and pagination.
   *
   * Supported filters: type, category, startDate, endDate, minAmount, maxAmount
   */
  findAll(filters = {}) {
    const db = getDatabase();
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 20,
      sortBy = 'date',
      order = 'desc',
    } = filters;

    const conditions = ['deleted_at IS NULL'];
    const params = [];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (startDate) {
      conditions.push('date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('date <= ?');
      params.push(endDate);
    }
    if (minAmount !== undefined && minAmount !== null) {
      conditions.push('amount >= ?');
      params.push(minAmount);
    }
    if (maxAmount !== undefined && maxAmount !== null) {
      conditions.push('amount <= ?');
      params.push(maxAmount);
    }

    const where = conditions.join(' AND ');

    // safe‑list columns that are allowed for sorting
    const allowedSort = ['date', 'amount', 'created_at', 'category', 'type'];
    const safeSort = allowedSort.includes(sortBy) ? sortBy : 'date';
    const safeOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // total count for pagination metadata
    const countResult = db.exec(
      `SELECT COUNT(*) as total FROM records WHERE ${where}`,
      params,
    );
    const total = countResult[0].values[0][0];

    const offset = (page - 1) * limit;
    const dataResult = db.exec(
      `SELECT * FROM records
       WHERE ${where}
       ORDER BY ${safeSort} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      items: this._rowsToArray(dataResult),
      total,
    };
  },

  /**
   * Update a record's fields.
   */
  update(id, fields) {
    const db = getDatabase();
    const allowed = ['amount', 'type', 'category', 'date', 'description'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (sets.length === 0) return this.findById(id);

    sets.push("updated_at = datetime('now')");
    params.push(id);

    db.run(
      `UPDATE records SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      params,
    );

    return this.findById(id);
  },

  /**
   * Soft‑delete a record.
   */
  softDelete(id) {
    const db = getDatabase();
    db.run(
      `UPDATE records SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [id],
    );
  },

  // ── aggregation queries for the dashboard ─────────────────────

  /**
   * Get overall totals: income, expenses, net balance.
   */
  getSummary() {
    const db = getDatabase();
    const result = db.exec(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
        COUNT(*) AS total_records
      FROM records
      WHERE deleted_at IS NULL
    `);
    const row = this._rowToObject(result);
    return {
      totalIncome: row.total_income,
      totalExpenses: row.total_expenses,
      netBalance: row.total_income - row.total_expenses,
      totalRecords: row.total_records,
    };
  },

  /**
   * Get totals grouped by category.
   */
  getCategoryTotals() {
    const db = getDatabase();
    const result = db.exec(`
      SELECT
        category,
        type,
        SUM(amount)  AS total,
        COUNT(*)     AS count
      FROM records
      WHERE deleted_at IS NULL
      GROUP BY category, type
      ORDER BY total DESC
    `);
    return this._rowsToArray(result);
  },

  /**
   * Get monthly trends for a given year.
   */
  getMonthlyTrends(year) {
    const db = getDatabase();
    const result = db.exec(
      `SELECT
         strftime('%m', date) AS month,
         type,
         SUM(amount) AS total,
         COUNT(*)    AS count
       FROM records
       WHERE deleted_at IS NULL
         AND strftime('%Y', date) = ?
       GROUP BY month, type
       ORDER BY month ASC`,
      [String(year)],
    );
    return this._rowsToArray(result);
  },

  /**
   * Get the most recent N records.
   */
  getRecent(limit = 10) {
    const db = getDatabase();
    const result = db.exec(
      `SELECT * FROM records
       WHERE deleted_at IS NULL
       ORDER BY date DESC, created_at DESC
       LIMIT ?`,
      [limit],
    );
    return this._rowsToArray(result);
  },

  // ── helpers ───────────────────────────────────────────────────

  _rowToObject(result) {
    if (!result || result.length === 0 || result[0].values.length === 0) return null;
    const columns = result[0].columns;
    const values = result[0].values[0];
    const obj = {};
    columns.forEach((col, i) => { obj[col] = values[i]; });
    return obj;
  },

  _rowsToArray(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map((row) => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  },
};

export default Record;
