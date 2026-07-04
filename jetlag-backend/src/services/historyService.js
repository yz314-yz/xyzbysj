const { listCheckinsByDiagnosis, summarizeCheckins } = require('../models/checkinModel');
const { findDiagnosisById, listDiagnosesByUser } = require('../models/diagnosisModel');
const { createHttpError } = require('../middleware/errors');

function listUserHistory(user) {
  return listDiagnosesByUser(user.id);
}

function getUserHistoryItem(user, id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createHttpError(400, '历史记录编号不正确。');
  }

  const item = findDiagnosisById(numericId, user.id);
  if (!item) throw createHttpError(404, '历史记录不存在。');
  const checkins = listCheckinsByDiagnosis(user.id, numericId);
  item.checkins = checkins;
  item.checkinSummary = summarizeCheckins(checkins);
  return item;
}

module.exports = { getUserHistoryItem, listUserHistory };
