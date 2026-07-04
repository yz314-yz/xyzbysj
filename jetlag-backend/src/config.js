const path = require('path');

const rootDir = path.join(__dirname, '..');
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

function numberFromEnv(name, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = process.env[name];
  const value = raw === undefined || raw === '' ? fallback : Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return fallback;
  return value;
}

function booleanFromEnv(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase());
}

const config = {
  rootDir,
  port: numberFromEnv('PORT', 3000, { min: 1, max: 65535 }),
  publicDir: path.join(rootDir, 'public'),
  uploadsDir: path.join(rootDir, 'uploads'),
  dataDir: process.env.DATA_DIR || path.join(rootDir, 'data'),
  logsDir: process.env.LOG_DIR || path.join(rootDir, 'logs'),
  databasePath: process.env.DATABASE_PATH || path.join(rootDir, 'data', 'tcm-wellness.sqlite'),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  publicApiBase: process.env.PUBLIC_API_BASE || '',
  allowedOrigins,
  trustedDevOrigins: new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ]),
  diagnoseRateWindowMs: numberFromEnv('DIAGNOSE_RATE_WINDOW_MS', 60 * 1000, { min: 1000 }),
  diagnoseRateMax: numberFromEnv('DIAGNOSE_RATE_MAX', 10, { min: 1 }),
  authRateWindowMs: numberFromEnv('AUTH_RATE_WINDOW_MS', 60 * 1000, { min: 1000 }),
  authRateMax: numberFromEnv('AUTH_RATE_MAX', 5, { min: 1 }),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '1mb',
  requireModelEvidence: booleanFromEnv('REQUIRE_MODEL_EVIDENCE', false),
};

module.exports = { config };
