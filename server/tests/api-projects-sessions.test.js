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
      .send({ name: '测试项目', code: 'TEST-001', tech_lead: '张三' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('测试项目');
    expect(res.body.code).toBe('TEST-001');
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/projects rejects missing required fields', async () => {
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
    const create = await request(app).post('/api/projects').send({ name: 'P', code: 'P-001' });
    const res = await request(app).get(`/api/projects/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('P');
  });

  test('GET /api/projects/:id returns 404 for missing', async () => {
    const app = getApp();
    const res = await request(app).get('/api/projects/99999');
    expect(res.status).toBe(404);
  });

  test('GET /api/projects/archived returns archived projects only', async () => {
    const app = getApp();
    const active = await request(app).post('/api/projects').send({ name: '活跃项目', code: 'ACTIVE-API-001' });
    const archived = await request(app).post('/api/projects').send({ name: '归档项目', code: 'ARCH-API-001' });

    await request(app).put(`/api/projects/${archived.body.id}/archive`).send();

    const activeList = await request(app).get('/api/projects');
    const archivedList = await request(app).get('/api/projects/archived');

    expect(activeList.status).toBe(200);
    expect(archivedList.status).toBe(200);
    expect(activeList.body.some(project => project.id === active.body.id)).toBe(true);
    expect(activeList.body.some(project => project.id === archived.body.id)).toBe(false);
    expect(archivedList.body.some(project => project.id === archived.body.id)).toBe(true);
  });

  test('PUT /api/projects/:id/archive and restore update project archive state', async () => {
    const app = getApp();
    const create = await request(app).post('/api/projects').send({ name: '项目归档恢复', code: 'ARCHIVE-001' });

    const archived = await request(app).put(`/api/projects/${create.body.id}/archive`).send();
    expect(archived.status).toBe(200);
    expect(archived.body.archived_at).toBeTruthy();

    const restored = await request(app).put(`/api/projects/${create.body.id}/restore`).send();
    expect(restored.status).toBe(200);
    expect(restored.body.archived_at).toBe(null);
  });
});

describe('API - Sessions', () => {
  let projectId;

  beforeEach(async () => {
    const app = getApp();
    const res = await request(app).post('/api/projects').send({ name: 'SessionTest', code: `SESSION-${Date.now()}-${Math.random()}` });
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

  test('DELETE /api/sessions/:id removes the session', async () => {
    const app = getApp();
    const create = await request(app).post('/api/sessions').send({
      project_id: projectId, tester: 'T', test_date: '2026-01-01',
    });

    const del = await request(app).delete(`/api/sessions/${create.body.id}`);
    const fetch = await request(app).get(`/api/sessions/${create.body.id}`);

    expect(del.status).toBe(200);
    expect(fetch.status).toBe(404);
  });
});
