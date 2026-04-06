import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import config from './index.js';

let db = null;

/**
 * Initialise (or open) the SQLite database and create tables if they don't
 * exist yet.  Returns the sql.js Database instance.
 */
export async function initDatabase(dbPath) {
  const resolvedPath = dbPath || config.db.path;

  // make sure the parent directory exists
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJs();

  // if a db file already exists, load it; otherwise start fresh
  if (fs.existsSync(resolvedPath)) {
    const fileBuffer = fs.readFileSync(resolvedPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // enable WAL‑like behaviour and foreign keys
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA foreign_keys = ON;');

  // ── schema ────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      name          TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'viewer'
                      CHECK(role IN ('viewer','analyst','admin')),
      status        TEXT    NOT NULL DEFAULT 'active'
                      CHECK(status IN ('active','inactive')),
      created_at    DATETIME DEFAULT (datetime('now')),
      updated_at    DATETIME DEFAULT (datetime('now')),
      deleted_at    DATETIME DEFAULT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      amount      REAL    NOT NULL,
      type        TEXT    NOT NULL CHECK(type IN ('income','expense')),
      category    TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      description TEXT,
      created_at  DATETIME DEFAULT (datetime('now')),
      updated_at  DATETIME DEFAULT (datetime('now')),
      deleted_at  DATETIME DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER,
      action      TEXT NOT NULL,
      resource    TEXT NOT NULL,
      resource_id INTEGER,
      details     TEXT,
      created_at  DATETIME DEFAULT (datetime('now'))
    );
  `);

  // helpful indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_records_date     ON records(date);');
  db.run('CREATE INDEX IF NOT EXISTS idx_records_type     ON records(type);');
  db.run('CREATE INDEX IF NOT EXISTS idx_records_category ON records(category);');
  db.run('CREATE INDEX IF NOT EXISTS idx_records_user_id  ON records(user_id);');

  return db;
}

/** Persist the in‑memory database back to disk. */
export function saveDatabase() {
  if (!db) return;
  const resolvedPath = config.db.path;
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(resolvedPath, buffer);
}

/** Get the active database instance. */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialised – call initDatabase() first.');
  }
  return db;
}

/** Close the database (useful for tests). */
export function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

/** Allow tests to inject a fresh in-memory DB without hitting disk. */
export async function initTestDatabase() {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');

  // same schema as production
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      name          TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'viewer'
                      CHECK(role IN ('viewer','analyst','admin')),
      status        TEXT    NOT NULL DEFAULT 'active'
                      CHECK(status IN ('active','inactive')),
      created_at    DATETIME DEFAULT (datetime('now')),
      updated_at    DATETIME DEFAULT (datetime('now')),
      deleted_at    DATETIME DEFAULT NULL
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      amount      REAL    NOT NULL,
      type        TEXT    NOT NULL CHECK(type IN ('income','expense')),
      category    TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      description TEXT,
      created_at  DATETIME DEFAULT (datetime('now')),
      updated_at  DATETIME DEFAULT (datetime('now')),
      deleted_at  DATETIME DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER,
      action      TEXT NOT NULL,
      resource    TEXT NOT NULL,
      resource_id INTEGER,
      details     TEXT,
      created_at  DATETIME DEFAULT (datetime('now'))
    );
  `);
  return db;
}
