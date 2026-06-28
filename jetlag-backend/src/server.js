const { createApp } = require('./app');
const { config } = require('./config');
const { logger } = require('./logger');
const { ensureDatabase } = require('./models/database');
const { scheduleMeridianReminders } = require('./services/reminderService');
const { warnIfUnsafeVisionConfig } = require('./qwenVision');

ensureDatabase();
warnIfUnsafeVisionConfig();
scheduleMeridianReminders();

const app = createApp();

app.listen(config.port, () => {
  logger.info('中医养生辅助系统后端已启动：http://localhost:' + config.port);
});
