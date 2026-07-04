const express = require('express');

const { listCheckins, saveCheckin } = require('../controllers/checkinController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /api/v1/checkins/{diagnosisId}:
 *   get:
 *     summary: 获取某次七日方案的打卡记录
 *     tags: [Checkins]
 */
router.get('/checkins/:diagnosisId', requireAuth, listCheckins);

/**
 * @openapi
 * /api/v1/checkins:
 *   post:
 *     summary: 新增或更新某天七日打卡
 *     tags: [Checkins]
 */
router.post('/checkins', requireAuth, saveCheckin);

module.exports = router;
