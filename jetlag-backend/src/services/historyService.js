const { findDiagnosisById, listDiagnosesByUser } = require('../models/diagnosisModel');
const { createHttpError } = require('../middleware/errors');

function listUserHistory(user) {
  return listDiagnosesByUser(user.id);
}

function getUserHistoryItem(user, id) {
  const item = findDiagnosisById(Number(id), user.id);
  if (!item) throw createHttpError(404, '历史记录不存在。');
  return item;
}

module.exports = { getUserHistoryItem, listUserHistory };
