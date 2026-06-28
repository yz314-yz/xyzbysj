const express = require('express');

const { health } = require('../controllers/healthController');

const router = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: 健康检查与 Qwen3-VL 上游探测
 *     tags: [Health]
 */
router.get('/health', health);

module.exports = router;
