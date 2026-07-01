const express = require('express');

const { registerSSEClient } = require('../services/reminderService');

const router = express.Router();

/**
 * @openapi
 * /api/v1/meridian-stream:
 *   get:
 *     summary: 子午流注时辰提醒 SSE 流（每小时推送一次）
 *     tags: [Meridian]
 */
router.get('/meridian-stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('event: connected\ndata: {"type":"connected"}\n\n');

  const unsubscribe = registerSSEClient(res);

  // 心跳保活，每 30 秒发一条注释，防止代理超时断开
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

module.exports = router;
