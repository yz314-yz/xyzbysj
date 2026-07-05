require('dotenv').config();
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
  if (!jwtSecret && process.env.NODE_ENV !== 'production') {
    logger.warn('未配置 JWT_SECRET，已生成随机临时密钥（重启后所有 token 失效）。请在 .env 中设置 JWT_SECRET 以保持登录态。');
  }
}

function startServer() {
  assertProductionJwtSecret();
  ensureDatabase();
  warnIfUnsafeVisionConfig();
  scheduleMeridianReminders();

  const app = createApp();

  process.on('unhandledRejection', (reason) => {
    logger.error('未处理的 Promise 拒绝：', reason);
  });
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常：', error);
    process.exit(1);
  });

  app.listen(config.port, () => {
    logger.info('中医养生辅助系统后端已启动：http://localhost:' + config.port);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { assertProductionJwtSecret, startServer };
