const express = require('express');
const rateLimit = require('express-rate-limit');

const { chat } = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: '请求过于频繁，请稍后再试。' },
});

/**
 * @openapi
 * /api/v1/chat:
 *   post:
 *     summary: 基于当前方案进行 AI 养生追问；离线演示模式下返回不可用提示
 *     tags: [Chat]
 */
router.post('/chat', chatLimiter, optionalAuth, chat);

module.exports = router;
