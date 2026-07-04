const express = require('express');
const rateLimit = require('express-rate-limit');

const { config } = require('../config');
const { diagnose, getHistoryItem, listHistory } = require('../controllers/diagnosisController');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { upload, validateUploadedImages } = require('../middleware/upload');

const router = express.Router();

const diagnoseLimiter = rateLimit({
  windowMs: config.diagnoseRateWindowMs,
  limit: config.diagnoseRateMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: '请求过于频繁，请稍后再试。' },
});

/**
 * @openapi
 * /api/v1/diagnose:
 *   post:
 *     summary: 生成七日养生分析；登录后自动保存历史记录
 *     tags: [Diagnosis]
 */
router.post(
  '/diagnose',
  diagnoseLimiter,
  optionalAuth,
  upload.fields([
    { name: 'tongue', maxCount: 1 },
    { name: 'face', maxCount: 1 },
    { name: 'palm', maxCount: 1 },
  ]),
  validateUploadedImages,
  diagnose
);

/**
 * @openapi
 * /api/v1/history:
 *   get:
 *     summary: 获取当前用户诊断历史
 *     tags: [History]
 */
router.get('/history', requireAuth, listHistory);

/**
 * @openapi
 * /api/v1/history/{id}:
 *   get:
 *     summary: 获取单条诊断历史详情
 *     tags: [History]
 */
router.get('/history/:id', requireAuth, getHistoryItem);

module.exports = router;
