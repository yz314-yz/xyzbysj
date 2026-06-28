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
});
