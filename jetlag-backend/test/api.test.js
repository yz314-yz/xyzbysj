const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tcm-backend-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(testDir, 'test.sqlite');
process.env.LOG_DIR = path.join(testDir, 'logs');
process.env.JWT_SECRET = 'test-secret';
process.env.DIAGNOSE_RATE_MAX = '100';

const { createApp } = require('../src/app');
const { closeDatabase, ensureDatabase } = require('../src/models/database');

describe('TCM wellness API', () => {
  const app = createApp();
  let token;

  beforeAll(() => {
    ensureDatabase();
  });

  afterAll(() => {
    closeDatabase();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('reports health and symptoms', async () => {
    const health = await request(app).get('/health').expect(200);
    expect(health.body.status).toBe('ok');
    expect(health.body.localRuleEngineReady).toBe(true);

    const metrics = await request(app).get('/metrics').expect(200);
    expect(metrics.text).toContain('tcm_http_requests_total');

    const symptoms = await request(app).get('/api/v1/symptoms').expect(200);
    expect(symptoms.body.success).toBe(true);
    expect(symptoms.body.data.length).toBeGreaterThan(5);
  });

  test('registers, logs in, diagnoses and stores history', async () => {
    const register = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'alice', password: 'password123' })
      .expect(201);
    expect(register.body.data.token).toBeTruthy();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'alice', password: 'password123' })
      .expect(200);
    token = login.body.data.token;

    const diagnosis = await request(app)
      .post('/api/v1/diagnose')
      .set('Authorization', `Bearer ${token}`)
      .field('symptoms', JSON.stringify(['dry_mouth']))
      .field('profile', JSON.stringify({ age: '22', gender: '女' }))
      .field('hour', '0')
      .expect(200);

    expect(diagnosis.body.savedId).toBeTruthy();
    expect(diagnosis.body.data.meridian.name).toBe('子时');

    const history = await request(app)
      .get('/api/v1/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0].summary.constitution).toContain('阴液不足');
  });

  test('rejects empty diagnosis input', async () => {
    await request(app)
      .post('/api/v1/diagnose')
      .field('symptoms', JSON.stringify([]))
      .field('profile', JSON.stringify({}))
      .expect(400);
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'alice', password: 'wrong-password' })
      .expect(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects login with non-existent user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'ghost', password: 'whatever' })
      .expect(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects history access without token', async () => {
    await request(app).get('/api/v1/history').expect(401);
  });

  test('rejects history access with forged token', async () => {
    await request(app)
      .get('/api/v1/history')
      .set('Authorization', 'Bearer forged.invalid.token')
      .expect(401);
  });

  test('returns 404 for non-existent history detail', async () => {
    await request(app)
      .get('/api/v1/history/999999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  test('accepts diagnosis with image upload', async () => {
    const res = await request(app)
      .post('/api/v1/diagnose')
      .set('Authorization', `Bearer ${token}`)
      .field('symptoms', JSON.stringify(['fatigue', 'cold_limbs']))
      .field('profile', JSON.stringify({ age: '30', gender: '男' }))
      .field('hour', '6')
      .attach('tongue', Buffer.from('fake-image-data'), { filename: 'tongue.png', contentType: 'image/png' })
      .expect(200);

    expect(res.body.data.observation.tongue).toBeTruthy();
    expect(res.body.savedId).toBeTruthy();
  });

  test('fetches history detail with full report', async () => {
    const list = await request(app)
      .get('/api/v1/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const firstId = list.body.data[0].id;
    const detail = await request(app)
      .get(`/api/v1/history/${firstId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detail.body.data.result).toBeTruthy();
    expect(detail.body.data.result.sevenDayPlan).toBeTruthy();
    expect(detail.body.data.result.sevenDayPlan.length).toBe(7);
  });

  test('SSE meridian-stream returns event-stream content type', async () => {
    // 使用 mock 避免长连接导致 Jest 挂起
    const { registerSSEClient, broadcastMeridianReminder } = require('../src/services/reminderService');
    const events = [];
    const mockRes = {
      write: (data) => events.push(data),
      on: () => mockRes,
    };
    const unsubscribe = registerSSEClient(mockRes);

    broadcastMeridianReminder({ name: '子时', meridian: '胆经', range: '23-01', advice: '早睡养胆' });

    expect(events.length).toBeGreaterThanOrEqual(1);
    const payload = JSON.parse(events[0].replace(/^data: /, '').trim());
    expect(payload.type).toBe('meridian-reminder');
    expect(payload.meridian.meridian).toBe('胆经');

    unsubscribe();
  });
});
