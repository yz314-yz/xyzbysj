const { answerChat } = require('../services/chatService');

async function chat(req, res, next) {
  try {
    const data = await answerChat(req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { chat };
