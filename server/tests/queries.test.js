const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.join(__dirname, 'queries-test.db');

beforeAll(() => {
  process.env.DB_PATH = TEST_DB_PATH;
  delete require.cache[require.resolve('../src/models/database')];
  delete require.cache[require.resolve('../src/models/queries')];
  const { initDB } = require('../src/models/database');
  initDB();
});

afterAll(() => {
  try {
    const { getDB } = require('../src/models/database');
    const db = getDB();
    db.close();
  } catch (e) { /* ignore */ }
  try {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  } catch (e) { /* ignore on Windows lock */ }
  [TEST_DB_PATH + '-wal', TEST_DB_PATH + '-shm'].forEach(f => {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { /* ignore */ }
  });
});

describe('Queries - Projects', () => {
  test('createProject and getProjectById', () => {
    const { createProject, getProjectById } = require('../src/models/queries');
    const p = createProject({ name: '项目A', tech_lead: '张三' });
    expect(p.id).toBeDefined();
    expect(p.name).toBe('项目A');
    const fetched = getProjectById(p.id);
    expect(fetched.tech_lead).toBe('张三');
  });

  test('getAllProjects returns all', () => {
    const { createProject, getAllProjects } = require('../src/models/queries');
    createProject({ name: 'P1' });
    createProject({ name: 'P2' });
    const all = getAllProjects();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  test('updateProject', () => {
    const { createProject, updateProject } = require('../src/models/queries');
    const p = createProject({ name: '旧名' });
    const updated = updateProject(p.id, { name: '新名', tech_lead: '李四' });
    expect(updated.name).toBe('新名');
    expect(updated.tech_lead).toBe('李四');
  });
});

describe('Queries - Sessions', () => {
  let projectId;

  beforeAll(() => {
    const { createProject } = require('../src/models/queries');
    const p = createProject({ name: '会话测试项目' });
    projectId = p.id;
  });

  test('createSession and getSessionById', () => {
    const { createSession, getSessionById } = require('../src/models/queries');
    const s = createSession({
      project_id: projectId,
      tester: '王五',
      test_date: '2026-04-10',
      vehicle_info: '沪A12345',
      route: '高速环线',
    });
    expect(s.id).toBeDefined();
    expect(s.tester).toBe('王五');
    expect(s.status).toBe('active');
    const fetched = getSessionById(s.id);
    expect(fetched.route).toBe('高速环线');
  });

  test('getAllSessions with project filter', () => {
    const { getAllSessions } = require('../src/models/queries');
    const filtered = getAllSessions(projectId);
    expect(filtered.every(s => s.project_id === projectId)).toBe(true);
  });

  test('updateSession status to completed', () => {
    const { createSession, updateSession } = require('../src/models/queries');
    const s = createSession({ project_id: projectId, tester: 'T', test_date: '2026-01-01' });
    const updated = updateSession(s.id, { status: 'completed' });
    expect(updated.status).toBe('completed');
  });
});

describe('Queries - Records', () => {
  let sessionId;

  beforeAll(() => {
    const { createProject, createSession } = require('../src/models/queries');
    const p = createProject({ name: '记录测试项目' });
    const s = createSession({ project_id: p.id, tester: 'T', test_date: '2026-01-01' });
    sessionId = s.id;
  });

  test('createRecord with all fields', () => {
    const { createRecord, getRecordById } = require('../src/models/queries');
    const r = createRecord({
      session_id: sessionId,
      raw_text: '前方有障碍物',
      summary: '感知障碍物异常',
      problem_type: '感知异常',
      severity: '一般',
      gps_lat: 31.2304,
      gps_lng: 121.4737,
    });
    expect(r.id).toBeDefined();
    expect(r.status).toBe('draft');
    expect(r.gps_lat).toBe(31.2304);
  });

  test('getRecordsBySession', () => {
    const { getRecordsBySession } = require('../src/models/queries');
    const records = getRecordsBySession(sessionId);
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records.every(r => r.session_id === sessionId)).toBe(true);
  });

  test('updateRecord status to submitted', () => {
    const { createRecord, updateRecord } = require('../src/models/queries');
    const r = createRecord({ session_id: sessionId, raw_text: 'test' });
    const updated = updateRecord(r.id, { status: 'submitted', edited_text: '编辑后' });
    expect(updated.status).toBe('submitted');
    expect(updated.edited_text).toBe('编辑后');
  });

  test('getSubmittedRecordsBySession only returns submitted', () => {
    const { createRecord, updateRecord, getSubmittedRecordsBySession } = require('../src/models/queries');
    const r1 = createRecord({ session_id: sessionId });
    updateRecord(r1.id, { status: 'submitted' });
    createRecord({ session_id: sessionId }); // stays draft
    const submitted = getSubmittedRecordsBySession(sessionId);
    expect(submitted.every(r => r.status === 'submitted')).toBe(true);
  });
});
