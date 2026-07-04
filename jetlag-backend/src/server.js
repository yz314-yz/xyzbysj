const { createApp } = require('./app');
const { config } = require('./config');
const { logger } = require('./logger');
const { ensureDatabase } = require('./models/database');
const { scheduleMeridianReminders } = require('./services/reminderService');
const { warnIfUnsafeVisionConfig } = require('./qwenVision');

function assertProductionJwtSecret() {
  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  if (process.env.NODE_ENV === 'production' && !jwtSecret) {
    logger.error('生产环境缺少 JWT_SECRET，已停止启动以避免使用默认弱密钥。');
    process.exit(1);
  }
}

function startServer() {
  assertProductionJwtSecret();
  ensureDatabase();
  warnIfUnsafeVisionConfig();
  scheduleMeridianReminders();

  const app = createApp();

  app.listen(config.port, () => {
    logger.info('中医养生辅助系统后端已启动：http://localhost:' + config.port);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { assertProductionJwtSecret, startServer };
