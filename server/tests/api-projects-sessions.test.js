const request = require('supertest');
const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.join(__dirname, 'api-test.db');

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

describe('API - Health', () => {
  test('GET /api/health returns ok', async () => {
    const app = getApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('API - Projects', () => {
  test('POST /api/projects creates a project', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/api/projects')
      .send({ name: '测试项目', tech_lead: '张三' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('测试项目');
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/projects rejects missing name', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/api/projects')
      .send({});
    expect(res.status).toBe(400);
  });

  test('GET /api/projects returns list', async () => {
    const app = getApp();
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/projects/:id returns single project', async () => {
    const app = getApp();
    const create = await request(app).post('/api/projects').send({ name: 'P' });
    const res = await request(app).get(`/api/projects/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('P');
  });

  test('GET /api/projects/:id returns 404 for missing', async () => {
    const app = getApp();
    const res = await request(app).get('/api/projects/99999');
    expect(res.status).toBe(404);
  });
});

describe('API - Sessions', () => {
  let projectId;

  beforeEach(async () => {
    const app = getApp();
    const res = await request(app).post('/api/projects').send({ name: 'SessionTest' });
    projectId = res.body.id;
  });

  test('POST /api/sessions creates a session', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/api/sessions')
      .send({
        project_id: projectId,
        tester: '王五',
        test_date: '2026-04-10',
        vehicle_info: '沪A12345',
        route: '高速环线',
      });
    expect(res.status).toBe(201);
    expect(res.body.tester).toBe('王五');
    expect(res.body.status).toBe('active');
  });

  test('POST /api/sessions rejects missing required fields', async () => {
    const app = getApp();
    const res = await request(app).post('/api/sessions').send({});
    expect(res.status).toBe(400);
  });

  test('GET /api/sessions returns list', async () => {
    const app = getApp();
    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/sessions?project_id=X filters by project', async () => {
    const app = getApp();
    await request(app).post('/api/sessions').send({
      project_id: projectId, tester: 'T', test_date: '2026-01-01',
    });
    const res = await request(app).get(`/api/sessions?project_id=${projectId}`);
    expect(res.status).toBe(200);
    expect(res.body.every(s => s.project_id === projectId)).toBe(true);
  });

  test('GET /api/sessions/:id returns session', async () => {
    const app = getApp();
    const create = await request(app).post('/api/sessions').send({
      project_id: projectId, tester: 'T', test_date: '2026-01-01',
    });
    const res = await request(app).get(`/api/sessions/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.tester).toBe('T');
  });

  test('PUT /api/sessions/:id updates session', async () => {
    const app = getApp();
    const create = await request(app).post('/api/sessions').send({
      project_id: projectId, tester: 'T', test_date: '2026-01-01',
    });
    const res = await request(app)
      .put(`/api/sessions/${create.body.id}`)
      .send({ status: 'completed', route: '新路线' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.route).toBe('新路线');
  });
});
