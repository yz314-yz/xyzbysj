const { symptoms } = require('../tcmKnowledge');

function listSymptoms(req, res) {
  res.json({ success: true, data: symptoms });
}

module.exports = { listSymptoms };
