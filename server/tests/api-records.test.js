const request = require('supertest');
const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.join(__dirname, 'api-records-test.db');

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

async function createTestSession() {
  const app = getApp();
  const project = await request(app).post('/api/projects').send({
    name: 'RecordTest',
    code: `RECORD-${Date.now()}-${Math.random()}`,
  });
  const session = await request(app).post('/api/sessions').send({
    project_id: project.body.id,
    tester: '测试员',
    test_date: '2026-04-10',
  });
  return session.body;
}

describe('API - Records', () => {
  let sessionId;

  beforeEach(async () => {
    const session = await createTestSession();
    sessionId = session.id;
  });

  test('POST /api/records creates a draft record', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/api/records')
      .send({
        session_id: sessionId,
        raw_text: '前方发现障碍物，需要紧急避让',
        gps_lat: 31.2304,
        gps_lng: 121.4737,
      });
    expect(res.status).toBe(201);
    expect(res.body.raw_text).toBe('前方发现障碍物，需要紧急避让');
    expect(res.body.status).toBe('draft');
    expect(res.body.gps_lat).toBe(31.2304);
  });

  test('POST /api/records rejects missing session_id', async () => {
    const app = getApp();
    const res = await request(app).post('/api/records').send({ raw_text: 'test' });
    expect(res.status).toBe(400);
  });

  test('GET /api/records?session_id=X returns records', async () => {
    const app = getApp();
    await request(app).post('/api/records').send({
      session_id: sessionId, raw_text: 'record 1',
    });
    await request(app).post('/api/records').send({
      session_id: sessionId, raw_text: 'record 2',
    });
    const res = await request(app).get(`/api/records?session_id=${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('GET /api/records/:id returns single record', async () => {
    const app = getApp();
    const create = await request(app).post('/api/records').send({
      session_id: sessionId, raw_text: 'single test',
    });
    const res = await request(app).get(`/api/records/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.raw_text).toBe('single test');
  });

  test('PUT /api/records/:id updates record and changes status', async () => {
    const app = getApp();
    const create = await request(app).post('/api/records').send({
      session_id: sessionId, raw_text: 'draft text',
    });
    const res = await request(app)
      .put(`/api/records/${create.body.id}`)
      .send({
        status: 'submitted',
        summary: '障碍物异常',
        problem_type: '感知异常',
        severity: '一般',
        edited_text: '编辑后的文字',
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('submitted');
    expect(res.body.summary).toBe('障碍物异常');
    expect(res.body.problem_type).toBe('感知异常');
    expect(res.body.edited_text).toBe('编辑后的文字');
  });

  test('PUT /api/records/:id returns 404 for missing', async () => {
    const app = getApp();
    const res = await request(app).put('/api/records/99999').send({ status: 'submitted' });
    expect(res.status).toBe(404);
  });

  test('record supports attachments', async () => {
    const app = getApp();
    const res = await request(app).post('/api/records').send({
      session_id: sessionId,
      attachments: [
        { type: 'photo', url: '/uploads/photo1.jpg' },
        { type: 'video', url: '/uploads/video1.mp4' },
      ],
    });
    expect(res.status).toBe(201);
    const attachments = JSON.parse(res.body.attachments);
    expect(attachments).toHaveLength(2);
    expect(attachments[0].type).toBe('photo');
  });
});
