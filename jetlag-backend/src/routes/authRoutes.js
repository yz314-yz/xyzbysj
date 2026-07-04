const express = require('express');
const rateLimit = require('express-rate-limit');

const { config } = require('../config');
const { login, me, register } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: config.authRateWindowMs,
  limit: config.authRateMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: '登录或注册尝试过于频繁，请稍后再试。' },
});

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: 注册用户并返回 JWT
 *     tags: [Auth]
 */
router.post('/register', authLimiter, register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: 用户登录并返回 JWT
 *     tags: [Auth]
 */
router.post('/login', authLimiter, login);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: 获取当前登录用户
 *     tags: [Auth]
 */
router.get('/me', requireAuth, me);

module.exports = router;
