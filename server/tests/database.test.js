const path = require('path');
const fs = require('fs');

// Use a separate test DB
const TEST_DB_PATH = path.join(__dirname, 'test.db');

beforeAll(() => {
  process.env.DB_PATH = TEST_DB_PATH;
  // Clear module cache to use test DB path
  delete require.cache[require.resolve('../src/models/database')];
  const { initDB } = require('../src/models/database');
  initDB();
});

afterAll(() => {
  try {
    const { getDB } = require('../src/models/database');
    getDB().close();
  } catch (e) { /* ignore */ }
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
  const walPath = TEST_DB_PATH + '-wal';
  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }
  const shmPath = TEST_DB_PATH + '-shm';
  if (fs.existsSync(shmPath)) {
    fs.unlinkSync(shmPath);
  }
});

describe('Database Schema', () => {
  test('should initialize DB with all tables', () => {
    const { getDB } = require('../src/models/database');
    const db = getDB();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('projects');
    expect(tableNames).toContain('test_sessions');
    expect(tableNames).toContain('records');
  });

  test('should insert and retrieve a project', () => {
    const { getDB } = require('../src/models/database');
    const db = getDB();
    const result = db.prepare('INSERT INTO projects (name, tech_lead) VALUES (?, ?)').run('测试项目A', '张三');
    expect(result.lastInsertRowid).toBeGreaterThan(0);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    expect(project.name).toBe('测试项目A');
    expect(project.tech_lead).toBe('张三');
  });

  test('should insert a test session linked to a project', () => {
    const { getDB } = require('../src/models/database');
    const db = getDB();
    const project = db.prepare('INSERT INTO projects (name, tech_lead) VALUES (?, ?)').run('测试项目B', '李四');
    const session = db.prepare(
      'INSERT INTO test_sessions (project_id, tester, test_date, vehicle_info, route, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(project.lastInsertRowid, '王五', '2026-04-10', '沪A12345', '高速环线', 'active');

    expect(session.lastInsertRowid).toBeGreaterThan(0);
    const saved = db.prepare('SELECT * FROM test_sessions WHERE id = ?').get(session.lastInsertRowid);
    expect(saved.tester).toBe('王五');
    expect(saved.project_id).toBe(project.lastInsertRowid);
  });

  test('should insert a record linked to a session', () => {
    const { getDB } = require('../src/models/database');
    const db = getDB();
    const project = db.prepare('INSERT INTO projects (name) VALUES (?)').run('P');
    const session = db.prepare(
      'INSERT INTO test_sessions (project_id, tester, test_date) VALUES (?, ?, ?)'
    ).run(project.lastInsertRowid, 'T', '2026-01-01');
    const record = db.prepare(
      'INSERT INTO records (session_id, raw_text, summary, problem_type, severity, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(session.lastInsertRowid, '语音文字内容', '问题摘要', '感知异常', '一般', 'draft');

    const saved = db.prepare('SELECT * FROM records WHERE id = ?').get(record.lastInsertRowid);
    expect(saved.raw_text).toBe('语音文字内容');
    expect(saved.status).toBe('draft');
    expect(saved.session_id).toBe(session.lastInsertRowid);
  });

  test('should enforce status constraint on records', () => {
    const { getDB } = require('../src/models/database');
    const db = getDB();
    const project = db.prepare('INSERT INTO projects (name) VALUES (?)').run('P');
    const session = db.prepare(
      'INSERT INTO test_sessions (project_id, tester, test_date) VALUES (?, ?, ?)'
    ).run(project.lastInsertRowid, 'T', '2026-01-01');

    expect(() => {
      db.prepare('INSERT INTO records (session_id, status) VALUES (?, ?)').run(session.lastInsertRowid, 'invalid');
    }).toThrow();
  });

  test('should enforce status constraint on sessions', () => {
    const { getDB } = require('../src/models/database');
    const db = getDB();
    const project = db.prepare('INSERT INTO projects (name) VALUES (?)').run('P');

    expect(() => {
      db.prepare('INSERT INTO test_sessions (project_id, tester, test_date, status) VALUES (?, ?, ?, ?)')
        .run(project.lastInsertRowid, 'T', '2026-01-01', 'invalid');
    }).toThrow();
  });
});
