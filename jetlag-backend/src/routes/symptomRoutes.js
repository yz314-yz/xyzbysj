const express = require('express');

const { listSymptoms } = require('../controllers/symptomController');

const router = express.Router();

/**
 * @openapi
 * /api/v1/symptoms:
 *   get:
 *     summary: 获取症状选项
 *     tags: [Symptoms]
 */
router.get('/symptoms', listSymptoms);

module.exports = router;
