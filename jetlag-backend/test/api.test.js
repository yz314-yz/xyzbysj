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
process.env.AUTH_RATE_MAX = '100';

const { createApp } = require('../src/app');
const { config } = require('../src/config');
const { logger } = require('../src/logger');
const { closeDatabase, ensureDatabase } = require('../src/models/database');
const { assertProductionJwtSecret } = require('../src/server');

const tinyPng = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000100ffff03000006000557bfab3d0000000049454e44ae426082',
  'hex'
);

describe('TCM wellness API', () => {
  const app = createApp();
  let token;
  let diagnosisId;

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
    expect(metrics.text).toContain('# TYPE tcm_http_request_duration_seconds_sum counter');
    expect(metrics.text).toContain('# TYPE tcm_http_request_duration_seconds_count counter');
    expect(metrics.text).not.toContain('# TYPE tcm_http_request_duration_seconds summary');

    const symptoms = await request(app).get('/api/v1/symptoms').expect(200);
    expect(symptoms.body.success).toBe(true);
    expect(symptoms.body.data.length).toBeGreaterThan(5);
  });

  test('stops production startup when JWT_SECRET is missing', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJwtSecret = process.env.JWT_SECRET;
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit:${code}`);
    });

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      expect(() => assertProductionJwtSecret()).toThrow('process.exit:1');
      expect(errorSpy).toHaveBeenCalledWith('生产环境缺少 JWT_SECRET，已停止启动以避免使用默认弱密钥。');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.JWT_SECRET = originalJwtSecret;
      errorSpy.mockRestore();
      exitSpy.mockRestore();
    }
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
    diagnosisId = diagnosis.body.savedId;
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

  test('runs public experience mode from browser features without Qwen', async () => {
    const browserFeatures = {
      tongue: {
        engine: 'browser-lightweight-v1',
        runtime: 'visitor-browser',
        imageQuality: 'good',
        safetyGate: 'pass',
        confidence: 0.76,
        observedFeatures: {
          lightLevel: '光线可用',
          clarity: '纹理清晰',
          colorTone: '色调偏红',
        },
        featureText: '舌像，光线可用，纹理清晰，色调偏红',
      },
    };

    const res = await request(app)
      .post('/api/v1/diagnose')
      .field('inferenceMode', 'public-free')
      .field('symptoms', JSON.stringify([]))
      .field('profile', JSON.stringify({ age: '24', gender: '女' }))
      .field('browserFeatures', JSON.stringify(browserFeatures))
      .field('hour', '10')
      .expect(200);

    expect(res.body.data.inferenceMode).toBe('public-free');
    expect(res.body.data.mode).toBe('public-free-browser-rules');
    expect(res.body.data.localVision.parsed.tongue.observedFeatures.colorTone).toBe('色调偏红');
    expect(res.body.data.qwenVision).toBeNull();
    expect(res.body.data.engineStatus.vision.requested).toBe(false);
  });

  test('accepts proxied diagnosis requests with X-Forwarded-For when trust proxy is enabled', async () => {
    const originalTrustProxy = config.trustProxy;
    config.trustProxy = 1;
    const proxiedApp = createApp();

    try {
      const res = await request(proxiedApp)
        .post('/api/v1/diagnose')
        .set('X-Forwarded-For', '203.0.113.24')
        .field('inferenceMode', 'public-free')
        .field('symptoms', JSON.stringify(['fatigue']))
        .field('profile', JSON.stringify({ age: '24', gender: '女' }))
        .field('hour', '10')
        .expect(200);

      expect(res.body.data.sevenDayPlan).toHaveLength(7);
    } finally {
      config.trustProxy = originalTrustProxy;
    }
  });

  test('strict product mode rejects lightweight browser features', async () => {
    const originalRequireModelEvidence = config.requireModelEvidence;
    config.requireModelEvidence = true;

    try {
      const browserFeatures = {
        tongue: {
          engine: 'browser-lightweight-v1',
          modelBacked: false,
          modelKind: 'canvas-quality-color-heuristic',
          runtime: 'visitor-browser',
          imageQuality: 'good',
          safetyGate: 'pass',
          confidence: 0.76,
          observedFeatures: {
            lightLevel: '光线可用',
            clarity: '纹理清晰',
            colorTone: '色调偏红',
          },
          featureText: '舌像，光线可用，纹理清晰，色调偏红',
        },
      };

      const res = await request(app)
        .post('/api/v1/diagnose')
        .field('inferenceMode', 'public-free')
        .field('symptoms', JSON.stringify([]))
        .field('profile', JSON.stringify({ age: '24', gender: '女' }))
        .field('browserFeatures', JSON.stringify(browserFeatures))
        .field('hour', '10')
        .expect(422);

      expect(res.body.error).toContain('上线严格模式要求公网体验版必须加载浏览器端多模态模型');
    } finally {
      config.requireModelEvidence = originalRequireModelEvidence;
    }
  });

  test('accepts low quality browser image features and marks them for review', async () => {
    const browserFeatures = {
      tongue: {
        engine: 'browser-lightweight-v1',
        modelBacked: false,
        runtime: 'visitor-browser',
        imageQuality: 'needs_review',
        safetyGate: 'review',
        confidence: 0.5,
        observedFeatures: {
          lightLevel: '光线偏暗',
          clarity: '清晰度偏低',
          colorTone: '色调平和',
        },
        featureText: '舌像，光线偏暗，清晰度偏低，色调平和',
      },
    };

    const res = await request(app)
      .post('/api/v1/diagnose')
      .field('inferenceMode', 'public-free')
      .field('symptoms', JSON.stringify(['fatigue']))
      .field('profile', JSON.stringify({ age: '24', gender: '女' }))
      .field('browserFeatures', JSON.stringify(browserFeatures))
      .field('hour', '10')
      .expect(200);

    expect(res.body.data.localVision.safetyGate).toBe('review');
    expect(res.body.data.localVision.parsed.tongue.imageQuality).toBe('needs_review');
    expect(res.body.data.sevenDayPlan).toHaveLength(7);
  });

  test('returns offline chat response when text model is not configured', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({
        question: '晚餐怎么安排更合适？',
        result: {
          constitution: { primary: '阴液不足', confidence: 82 },
          sevenDayPlan: [{ day: '第 1 天', theme: '养阴生津', diet: '银耳百合羹' }],
        },
      })
      .expect(200);

    expect(res.body.data.available).toBe(false);
    expect(res.body.data.reply).toContain('离线演示模式');
  });

  test('rejects empty chat question', async () => {
    await request(app)
      .post('/api/v1/chat')
      .send({ question: '' })
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

  test('creates and lists seven-day checkins', async () => {
    const saved = await request(app)
      .post('/api/v1/checkins')
      .set('Authorization', `Bearer ${token}`)
      .send({
        diagnosisId,
        day: 1,
        dietDone: true,
        exerciseDone: false,
        sleepDone: true,
        rating: 4,
        note: '晚餐清淡，睡前泡脚。',
      })
      .expect(200);

    expect(saved.body.data.item.day).toBe(1);
    expect(saved.body.data.item.dietDone).toBe(true);
    expect(saved.body.data.summary.completedDays).toBe(1);

    const list = await request(app)
      .get(`/api/v1/checkins/${diagnosisId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.data.items).toHaveLength(1);
    expect(list.body.data.items[0].note).toContain('泡脚');
  });

  test('rejects checkins without login or invalid day', async () => {
    await request(app)
      .post('/api/v1/checkins')
      .send({ diagnosisId, day: 1, dietDone: true })
      .expect(401);

    await request(app)
      .post('/api/v1/checkins')
      .set('Authorization', `Bearer ${token}`)
      .send({ diagnosisId, day: 8, dietDone: true })
      .expect(400);
  });

  test('returns 404 for non-existent history detail', async () => {
    await request(app)
      .get('/api/v1/history/999999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  test('returns 400 for malformed history detail id', async () => {
    const res = await request(app)
      .get('/api/v1/history/not-a-number')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res.body.error).toBe('历史记录编号不正确。');
  });

  test('accepts diagnosis with image upload', async () => {
    const res = await request(app)
      .post('/api/v1/diagnose')
      .set('Authorization', `Bearer ${token}`)
      .field('symptoms', JSON.stringify(['fatigue', 'cold_limbs']))
      .field('profile', JSON.stringify({ age: '30', gender: '男' }))
      .field('hour', '6')
      .attach('tongue', tinyPng, { filename: 'tongue.png', contentType: 'image/png' })
      .expect(200);

    expect(res.body.data.observation.tongue).toBeTruthy();
    expect(res.body.savedId).toBeTruthy();
  });

  test('rejects image upload when MIME type is forged', async () => {
    const res = await request(app)
      .post('/api/v1/diagnose')
      .set('Authorization', `Bearer ${token}`)
      .field('symptoms', JSON.stringify(['fatigue']))
      .field('profile', JSON.stringify({ age: '30', gender: '男' }))
      .field('hour', '6')
      .attach('tongue', Buffer.from('fake-image-data'), { filename: 'tongue.png', contentType: 'image/png' })
      .expect(415);

    expect(res.body.error).toContain('图片文件内容与类型不匹配');
  });

  test('fetches history detail with full report', async () => {
    const detail = await request(app)
      .get(`/api/v1/history/${diagnosisId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detail.body.data.result).toBeTruthy();
    expect(detail.body.data.result.sevenDayPlan).toBeTruthy();
    expect(detail.body.data.result.sevenDayPlan.length).toBe(7);
    expect(detail.body.data.checkins.length).toBeGreaterThanOrEqual(1);
    expect(detail.body.data.checkinSummary.completedDays).toBeGreaterThanOrEqual(1);
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
