const request = require('supertest');
const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.join(__dirname, 'api-upload-export-test.db');

beforeAll(() => {
  process.env.DB_PATH = TEST_DB_PATH;
  delete require.cache[require.resolve('../src/models/database')];
  delete require.cache[require.resolve('../src/models/queries')];
  delete require.cache[require.resolve('../src/app')];
});

afterAll(() => {
  try {
    const { getDB } = require('../src/models/database');
    getDB().close();
  } catch (e) { /* ignore */ }
  [TEST_DB_PATH, TEST_DB_PATH + '-wal', TEST_DB_PATH + '-shm'].forEach(f => {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { /* ignore */ }
  });
});

function getApp() {
  return require('../src/app');
}

async function createTestSessionWithRecords() {
  const app = getApp();
  const project = await request(app).post('/api/projects').send({
    name: 'ExportTest',
    code: `EXPORT-${Date.now()}-${Math.random()}`,
  });
  const session = await request(app).post('/api/sessions').send({
    project_id: project.body.id,
    tester: '测试员',
    test_date: '2026-04-10',
  });
  // Create and submit a record
  const record = await request(app).post('/api/records').send({
    session_id: session.body.id,
    raw_text: '测试记录文字',
    summary: '测试摘要',
    problem_type: '感知异常',
    severity: '一般',
  });
  await request(app).put(`/api/records/${record.body.id}`).send({ status: 'submitted' });
  return session.body;
}

describe('API - Upload', () => {
  test('POST /api/upload requires file', async () => {
    const app = getApp();
    const res = await request(app).post('/api/upload');
    expect(res.status).toBe(400);
  });
});

describe('API - Export', () => {
  test('GET /api/export/excel returns xlsx file', async () => {
    const session = await createTestSessionWithRecords();
    const app = getApp();
    const res = await request(app)
      .get('/api/export/excel')
      .query({ session_id: session.id });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
    expect(res.headers['content-disposition']).toContain('.xlsx');
    // supertest may parse binary as object; just check headers are correct
  });

  test('GET /api/export/csv returns csv file', async () => {
    const session = await createTestSessionWithRecords();
    const app = getApp();
    const res = await request(app)
      .get('/api/export/csv')
      .query({ session_id: session.id });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('.csv');
  });

  test('GET /api/export/excel rejects missing session_id', async () => {
    const app = getApp();
    const res = await request(app).get('/api/export/excel');
    expect(res.status).toBe(400);
  });

  test('GET /api/export/excel returns 404 for missing session', async () => {
    const app = getApp();
    const res = await request(app).get('/api/export/excel').query({ session_id: 99999 });
    expect(res.status).toBe(404);
  });
});
