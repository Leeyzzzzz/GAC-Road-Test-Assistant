const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'roadtest.db');

let db;

function columnExists(database, tableName, columnName) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some(column => column.name === columnName);
}

function getDB() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      tech_lead TEXT,
      archived_at DATETIME,
      created_at DATETIME DEFAULT (datetime('now','localtime')),
      updated_at DATETIME DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS test_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      tester TEXT NOT NULL,
      test_date TEXT NOT NULL,
      vehicle_info TEXT,
      route TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
      created_at DATETIME DEFAULT (datetime('now','localtime')),
      updated_at DATETIME DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      audio_url TEXT,
      raw_text TEXT,
      attachments TEXT DEFAULT '[]',
      summary TEXT,
      problem_type TEXT,
      severity TEXT,
      details TEXT,
      gps_lat REAL,
      gps_lng REAL,
      gps_address TEXT,
      weather TEXT,
      occurred_at DATETIME,
      edited_text TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      created_at DATETIME DEFAULT (datetime('now','localtime')),
      updated_at DATETIME DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (session_id) REFERENCES test_sessions(id) ON DELETE CASCADE
    );
  `);

  if (!columnExists(db, 'projects', 'code')) {
    db.exec('ALTER TABLE projects ADD COLUMN code TEXT');
  }

  if (!columnExists(db, 'projects', 'archived_at')) {
    db.exec('ALTER TABLE projects ADD COLUMN archived_at DATETIME');
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_code_unique
    ON projects(code)
    WHERE code IS NOT NULL AND code != '';
  `);

  return db;
}

module.exports = { getDB, initDB };
