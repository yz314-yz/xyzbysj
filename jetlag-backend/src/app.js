const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');

const { config } = require('./config');
const { httpLogStream } = require('./logger');
const { errorHandler, createHttpError, notFoundHandler } = require('./middleware/errors');
const authRoutes = require('./routes/authRoutes');
const diagnosisRoutes = require('./routes/diagnosisRoutes');
const healthRoutes = require('./routes/healthRoutes');
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

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  if (config.allowedOrigins.includes(origin)) return true;
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

  app.use(cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(createHttpError(403, '当前页面来源未被允许访问接口。'));
    },
  }));
  app.use(morgan('combined', { stream: httpLogStream }));
  app.use(metricsMiddleware);
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  app.get('/env.js', (req, res) => {
    res.type('application/javascript').send(
      'window.__APP_CONFIG__ = { API_BASE: ' + JSON.stringify(config.publicApiBase) + ' };'
    );
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/openapi.json', (req, res) => res.json(swaggerSpec));
  app.use(healthRoutes);
  app.use(metricsRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1', symptomRoutes);
  app.use('/api/v1', diagnosisRoutes);

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
