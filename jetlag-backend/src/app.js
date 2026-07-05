const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const { config } = require('./config');
const { httpLogStream } = require('./logger');
const { errorHandler, createHttpError, notFoundHandler } = require('./middleware/errors');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const diagnosisRoutes = require('./routes/diagnosisRoutes');
const healthRoutes = require('./routes/healthRoutes');
const meridianRoutes = require('./routes/meridianRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const symptomRoutes = require('./routes/symptomRoutes');
const { swaggerSpec } = require('./swagger');
const { metricsMiddleware } = require('./metrics');

function getCspConnectSources() {
  const sources = new Set(["'self'"]);
  config.allowedOrigins.forEach((origin) => sources.add(origin));

  try {
    if (config.publicApiBase) sources.add(new URL(config.publicApiBase).origin);
  } catch {
    // PUBLIC_API_BASE may be relative.
  }

  return Array.from(sources);
}

function isAllowedCorsOrigin(origin, requestHost) {
  if (!origin) return true;
  if (config.allowedOrigins.includes(origin)) return true;
  // 同源请求放行：Origin 的 host 与当前请求 Host 相同（单容器部署场景，如 Hugging Face Space）
  if (requestHost) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === requestHost) return true;
    } catch {
      // ignore
    }
  }
  if (config.allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
    if (config.trustedDevOrigins.has(origin)) return true;
    try {
      const url = new URL(origin);
      return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    } catch {
      return false;
    }
  }
  return false;
}

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'frame-ancestors': ["'none'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'object-src': ["'none'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'connect-src': getCspConnectSources(),
      },
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  }));

  // 自定义 CORS：同源请求（Origin host === 请求 Host）直接放行，适配单容器部署
  app.use((req, res, next) => {
    const origin = req.get('origin');
    const requestHost = req.get('host') || '';
    if (isAllowedCorsOrigin(origin, requestHost)) {
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        return res.status(204).end();
      }
      next();
      return;
    }
    next(createHttpError(403, '当前页面来源未被允许访问接口。'));
  });
  app.use(morgan('combined', { stream: httpLogStream }));

  // 全局 IP 维度限流：防止任意接口被滥用。健康检查、指标、SSE、Swagger 排除。
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.GLOBAL_RATE_MAX) || 120,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => ['/health', '/metrics', '/api/v1/meridian-stream', '/api-docs', '/openapi.json'].includes(req.path),
    message: { success: false, error: '请求过于频繁，请稍后再试。' },
  });
  app.use(globalLimiter);
  app.use(metricsMiddleware);
  app.use(express.json({ limit: config.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.jsonBodyLimit }));

  app.get('/env.js', (req, res) => {
    res.type('application/javascript').send(
      'window.__APP_CONFIG__ = { API_BASE: ' + JSON.stringify(config.publicApiBase) + ' };'
    );
  });

  if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/openapi.json', (req, res) => res.json(swaggerSpec));
  }
  app.use(healthRoutes);
  app.use(metricsRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1', chatRoutes);
  app.use('/api/v1', checkinRoutes);
  app.use('/api/v1', symptomRoutes);
  app.use('/api/v1', diagnosisRoutes);
  app.use('/api/v1', meridianRoutes);

  if (fs.existsSync(config.publicDir)) {
    app.use(express.static(config.publicDir));
    app.use((req, res, next) => {
      if (
        req.path.startsWith('/api/')
        || req.path === '/health'
        || req.path === '/metrics'
        || req.path === '/openapi.json'
      ) {
        next();
        return;
      }
      res.sendFile(path.join(config.publicDir, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
