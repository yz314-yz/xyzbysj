const path = require('path');

const rootDir = path.join(__dirname, '..');
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const config = {
  rootDir,
  port: Number(process.env.PORT || 3000),
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
  diagnoseRateWindowMs: Number(process.env.DIAGNOSE_RATE_WINDOW_MS || 60 * 1000),
  diagnoseRateMax: Number(process.env.DIAGNOSE_RATE_MAX || 10),
};

module.exports = { config };
