const { z } = require('zod');

const { listCheckinsByDiagnosis, summarizeCheckins, upsertCheckin } = require('../models/checkinModel');
const { findDiagnosisById } = require('../models/diagnosisModel');
const { createHttpError } = require('../middleware/errors');

const positiveIdSchema = z.coerce.number().int('记录编号不正确。').positive('记录编号不正确。');

const checkinSchema = z.object({
  diagnosisId: positiveIdSchema,
  day: z.coerce.number().int('打卡天数不正确。').min(1, '打卡天数不正确。').max(7, '打卡天数不正确。'),
  dietDone: z.boolean().default(false),
  exerciseDone: z.boolean().default(false),
  sleepDone: z.boolean().default(false),
  rating: z.coerce.number().int('主观感受评分需为 1-5。').min(1, '主观感受评分需为 1-5。').max(5, '主观感受评分需为 1-5。').nullable().optional(),
  note: z.string().trim().max(300, '打卡备注不能超过 300 字。').optional().default(''),
});

function assertDiagnosisOwner(user, diagnosisId) {
  const diagnosis = findDiagnosisById(diagnosisId, user.id);
  if (!diagnosis) {
    throw createHttpError(404, '方案不存在或无权访问。');
  }
}

function listUserCheckins(user, diagnosisId) {
  const numericId = positiveIdSchema.parse(diagnosisId);
  assertDiagnosisOwner(user, numericId);
  const items = listCheckinsByDiagnosis(user.id, numericId);
  return { items, summary: summarizeCheckins(items) };
}

function saveUserCheckin(user, body) {
  const payload = checkinSchema.parse(body || {});
  assertDiagnosisOwner(user, payload.diagnosisId);
  const item = upsertCheckin({
    userId: user.id,
    diagnosisId: payload.diagnosisId,
    day: payload.day,
    dietDone: payload.dietDone,
    exerciseDone: payload.exerciseDone,
    sleepDone: payload.sleepDone,
    rating: payload.rating ?? null,
    note: payload.note,
  });
  const items = listCheckinsByDiagnosis(user.id, payload.diagnosisId);
  return { item, items, summary: summarizeCheckins(items) };
}

module.exports = { listUserCheckins, saveUserCheckin };
