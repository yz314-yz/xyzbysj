const cron = require('node-cron');

const { currentMeridian } = require('./analysisService');
const { logger } = require('../logger');

let scheduled = false;

function scheduleMeridianReminders() {
  if (scheduled || process.env.ENABLE_MERIDIAN_CRON !== 'true') return;

  cron.schedule('0 * * * *', () => {
    const meridian = currentMeridian(new Date().getHours());
    logger.info('时辰养生提醒：' + meridian.name + ' · ' + meridian.meridian + '：' + meridian.advice);
  });

  scheduled = true;
  logger.info('子午流注时辰提醒定时任务已启用。');
}

module.exports = { scheduleMeridianReminders };
