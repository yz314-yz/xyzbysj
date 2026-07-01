const cron = require('node-cron');

const { currentMeridian } = require('./analysisService');
const { logger } = require('../logger');

let scheduled = false;
const clients = new Set();

/**
 * 注册一个 SSE 客户端响应对象，返回取消注册函数。
 * cron 每小时触发时会向所有已注册客户端推送时辰养生提醒。
 */
function registerSSEClient(res) {
  clients.add(res);
  res.on('close', () => clients.delete(res));
  return () => clients.delete(res);
}

function broadcastMeridianReminder(meridian) {
  const payload = {
    type: 'meridian-reminder',
    timestamp: new Date().toISOString(),
    meridian: {
      name: meridian.name,
      meridian: meridian.meridian,
      range: meridian.range,
      advice: meridian.advice,
    },
  };
  const data = 'data: ' + JSON.stringify(payload) + '\n\n';
  let sent = 0;
  clients.forEach((res) => {
    try {
      res.write(data);
      sent += 1;
    } catch (error) {
      logger.warn('SSE 推送失败：' + error.message);
      clients.delete(res);
    }
  });
  logger.info('时辰养生提醒已推送：' + meridian.name + ' · ' + meridian.meridian + '（送达 ' + sent + ' 个客户端）');
}

function scheduleMeridianReminders() {
  if (scheduled || process.env.ENABLE_MERIDIAN_CRON !== 'true') return;

  cron.schedule('0 * * * *', () => {
    const meridian = currentMeridian(new Date().getHours());
    broadcastMeridianReminder(meridian);
  });

  scheduled = true;
  logger.info('子午流注时辰提醒定时任务已启用（SSE 推送模式）。');
}

module.exports = { broadcastMeridianReminder, registerSSEClient, scheduleMeridianReminders };
