const express = require('express');

const { chat } = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /api/v1/chat:
 *   post:
 *     summary: 基于当前方案进行 AI 养生追问；离线演示模式下返回不可用提示
 *     tags: [Chat]
 */
router.post('/chat', optionalAuth, chat);

module.exports = router;
