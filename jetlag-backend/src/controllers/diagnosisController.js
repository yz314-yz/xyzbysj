const { cleanupFiles } = require('../middleware/upload');
const { runDiagnosis } = require('../services/analysisService');
const { getUserHistoryItem, listUserHistory } = require('../services/historyService');

async function diagnose(req, res, next) {
  try {
    const data = await runDiagnosis({
      body: req.body,
      files: req.files || {},
      user: req.user,
    });
    res.json({ success: true, data: data.analysis, savedId: data.savedId });
  } catch (error) {
    next(error);
  } finally {
    cleanupFiles(req.files).catch(() => {});
  }
}

function listHistory(req, res, next) {
  try {
    res.json({ success: true, data: listUserHistory(req.user) });
  } catch (error) {
    next(error);
  }
}

function getHistoryItem(req, res, next) {
  try {
    res.json({ success: true, data: getUserHistoryItem(req.user, req.params.id) });
  } catch (error) {
    next(error);
  }
}

module.exports = { diagnose, getHistoryItem, listHistory };
