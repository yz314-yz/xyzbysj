const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const { config } = require('../config');
const { createUser, findUserByUsername } = require('../models/userModel');
const { createHttpError } = require('../middleware/errors');

const authSchema = z.object({
  username: z.string().trim().min(3, '用户名至少 3 个字符。').max(32, '用户名不能超过 32 个字符。'),
  password: z.string().min(6, '密码至少 6 个字符。').max(72, '密码不能超过 72 个字符。'),
});

function signUserToken(user) {
  return jwt.sign(
    { username: user.username },
    config.jwtSecret,
    { subject: String(user.id), expiresIn: config.jwtExpiresIn }
  );
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };
}

async function registerUser(body) {
  const payload = authSchema.parse(body);
  const existing = findUserByUsername(payload.username);
  if (existing) throw createHttpError(409, '用户名已存在。');

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = createUser({ username: payload.username, passwordHash });
  return { token: signUserToken(user), user: toPublicUser(user) };
}

async function loginUser(body) {
  const payload = authSchema.parse(body);
  const user = findUserByUsername(payload.username);
  const passwordMatches = user
    ? await bcrypt.compare(payload.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    throw createHttpError(401, '用户名或密码不正确。');
  }

  return { token: signUserToken(user), user: toPublicUser(user) };
}

module.exports = { loginUser, registerUser, toPublicUser };
