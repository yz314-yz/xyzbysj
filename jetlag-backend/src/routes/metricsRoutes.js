const express = require('express');

const { metricsHandler } = require('../metrics');

const router = express.Router();

function isLocalhost(host) {
  if (!host) return false;
  const hostname = String(host).split(':')[0];
  return ['127.0.0.1', 'localhost', '::1'].includes(hostname);
}

/**
 * 生产环境保护 /metrics：仅允许本机访问，避免暴露运行指标。
 * 开发环境保持开放以便本地调试。
 */
function metricsGuard(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  if (isLocalhost(req.get('host')) || isLocalhost(req.get('x-forwarded-for'))) {
    return next();
  }
  res.status(404).json({ success: false, error: '接口不存在。' });
}

/**
 * @openapi
 * /metrics:
 *   get:
 *     summary: Prometheus 兼容运行指标
 *     tags: [Health]
 */
router.get('/metrics', metricsGuard, metricsHandler);

module.exports = router;
