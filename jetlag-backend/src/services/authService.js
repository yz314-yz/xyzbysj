const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const { config } = require('../config');
const { createUser, findUserByUsername } = require('../models/userModel');
const { createHttpError } = require('../middleware/errors');

// bcrypt rounds：12 在安全与响应延迟间取得平衡（约 250-300ms）
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;
// 用于用户不存在时的固定 dummy compare，消除用户名枚举的时序差
const DUMMY_HASH = '$2b$12$2Yzl224WWYXafRwFlzV1SuUDTtESYk6QjM09Ui2sxr1eAMJD.7m/K';

const authSchema = z.object({
  username: z.string().trim().min(3, '用户名至少 3 个字符。').max(32, '用户名不能超过 32 个字符。'),
  password: z.string().min(6, '密码至少 6 个字符。').max(72, '密码不能超过 72 个字符。'),
});

function signUserToken(user) {
  return jwt.sign(
    { username: user.username },
    config.jwtSecret,
    { subject: String(user.id), expiresIn: config.jwtExpiresIn, algorithm: 'HS256' }
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

  const passwordHash = await bcrypt.hash(payload.password, BCRYPT_ROUNDS);
  let user;
  try {
    user = createUser({ username: payload.username, passwordHash });
  } catch (error) {
    // 并发注册同名时 UNIQUE 约束触发，转 409 而非 500
    if (error && (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE/i.test(error.message || ''))) {
      throw createHttpError(409, '用户名已存在。');
    }
    throw error;
  }
  return { token: signUserToken(user), user: toPublicUser(user) };
}

async function loginUser(body) {
  const payload = authSchema.parse(body);
  const user = findUserByUsername(payload.username);
  // 即使用户不存在也执行一次固定 compare，避免通过响应时间差枚举用户名
  const passwordMatches = user
    ? await bcrypt.compare(payload.password, user.passwordHash)
    : await bcrypt.compare(payload.password, DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw createHttpError(401, '用户名或密码不正确。');
  }

  return { token: signUserToken(user), user: toPublicUser(user) };
}

module.exports = { loginUser, registerUser, toPublicUser };
