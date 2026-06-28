const express = require('express');

const { metricsHandler } = require('../metrics');

const router = express.Router();

/**
 * @openapi
 * /metrics:
 *   get:
 *     summary: Prometheus 兼容运行指标
 *     tags: [Health]
 */
router.get('/metrics', metricsHandler);

module.exports = router;
