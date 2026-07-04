const { listUserCheckins, saveUserCheckin } = require('../services/checkinService');

function listCheckins(req, res, next) {
  try {
    res.json({ success: true, data: listUserCheckins(req.user, req.params.diagnosisId) });
  } catch (error) {
    next(error);
  }
}

function saveCheckin(req, res, next) {
  try {
    res.json({ success: true, data: saveUserCheckin(req.user, req.body) });
  } catch (error) {
    next(error);
  }
}

module.exports = { listCheckins, saveCheckin };
