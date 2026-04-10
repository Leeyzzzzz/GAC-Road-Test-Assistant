const { getDB } = require('./database');

// ========== Projects ==========

function getAllProjects() {
  const db = getDB();
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
}

function getProjectById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

function createProject({ name, tech_lead }) {
  const db = getDB();
  const result = db.prepare('INSERT INTO projects (name, tech_lead) VALUES (?, ?)').run(name, tech_lead || null);
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
}

function updateProject(id, { name, tech_lead }) {
  const db = getDB();
  db.prepare('UPDATE projects SET name = ?, tech_lead = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?')
    .run(name, tech_lead || null, id);
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

// ========== Test Sessions ==========

function getAllSessions(projectId) {
  const db = getDB();
  if (projectId) {
    return db.prepare('SELECT * FROM test_sessions WHERE project_id = ? ORDER BY test_date DESC').all(projectId);
  }
  return db.prepare('SELECT * FROM test_sessions ORDER BY test_date DESC').all();
}

function getSessionById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM test_sessions WHERE id = ?').get(id);
}

function createSession({ project_id, tester, test_date, vehicle_info, route }) {
  const db = getDB();
  const result = db.prepare(
    'INSERT INTO test_sessions (project_id, tester, test_date, vehicle_info, route) VALUES (?, ?, ?, ?, ?)'
  ).run(project_id, tester, test_date, vehicle_info || null, route || null);
  return db.prepare('SELECT * FROM test_sessions WHERE id = ?').get(result.lastInsertRowid);
}

function updateSession(id, { tester, test_date, vehicle_info, route, status }) {
  const db = getDB();
  const existing = getSessionById(id);
  if (!existing) return null;
  db.prepare(
    'UPDATE test_sessions SET tester = ?, test_date = ?, vehicle_info = ?, route = ?, status = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?'
  ).run(
    tester || existing.tester,
    test_date || existing.test_date,
    vehicle_info !== undefined ? vehicle_info : existing.vehicle_info,
    route !== undefined ? route : existing.route,
    status || existing.status,
    id
  );
  return getSessionById(id);
}

// ========== Records ==========

function getRecordsBySession(sessionId) {
  const db = getDB();
  return db.prepare('SELECT * FROM records WHERE session_id = ? ORDER BY created_at DESC').all(sessionId);
}

function getRecordById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM records WHERE id = ?').get(id);
}

function createRecord(data) {
  const db = getDB();
  const {
    session_id, audio_url, raw_text, attachments,
    summary, problem_type, severity, details,
    gps_lat, gps_lng, gps_address, weather, occurred_at,
  } = data;
  const result = db.prepare(`
    INSERT INTO records (session_id, audio_url, raw_text, attachments, summary, problem_type, severity, details, gps_lat, gps_lng, gps_address, weather, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    session_id,
    audio_url || null,
    raw_text || null,
    JSON.stringify(attachments || []),
    summary || null,
    problem_type || null,
    severity || null,
    details || null,
    gps_lat || null,
    gps_lng || null,
    gps_address || null,
    weather || null,
    occurred_at || null
  );
  return getRecordById(result.lastInsertRowid);
}

function updateRecord(id, data) {
  const db = getDB();
  const existing = getRecordById(id);
  if (!existing) return null;

  const fields = [];
  const values = [];
  const allowedFields = [
    'audio_url', 'raw_text', 'attachments', 'summary', 'problem_type',
    'severity', 'details', 'gps_lat', 'gps_lng', 'gps_address', 'weather',
    'occurred_at', 'edited_text', 'status'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(field === 'attachments' ? JSON.stringify(data[field]) : data[field]);
    }
  }

  if (fields.length === 0) return existing;

  fields.push('updated_at = datetime(\'now\',\'localtime\')');
  values.push(id);

  db.prepare(`UPDATE records SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getRecordById(id);
}

function getSubmittedRecordsBySession(sessionId) {
  const db = getDB();
  return db.prepare('SELECT * FROM records WHERE session_id = ? AND status = ? ORDER BY created_at DESC')
    .all(sessionId, 'submitted');
}

module.exports = {
  getAllProjects, getProjectById, createProject, updateProject,
  getAllSessions, getSessionById, createSession, updateSession,
  getRecordsBySession, getRecordById, createRecord, updateRecord, getSubmittedRecordsBySession,
};
