const { loginUser, registerUser, toPublicUser } = require('../services/authService');

async function register(req, res, next) {
  try {
    const data = await registerUser(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const data = await loginUser(req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.json({ success: true, data: { user: toPublicUser(req.user) } });
}

module.exports = { login, me, register };
