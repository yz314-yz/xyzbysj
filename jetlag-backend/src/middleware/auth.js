const jwt = require('jsonwebtoken');

const { config } = require('../config');
const { findUserById } = require('../models/userModel');
const { createHttpError } = require('./errors');

function parseBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice('Bearer '.length).trim();
}

function readUserFromToken(req) {
  const token = parseBearerToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = findUserById(payload.sub);
    return user || null;
  } catch {
    return null;
  }
}

function optionalAuth(req, res, next) {
  req.user = readUserFromToken(req);
  next();
}

function requireAuth(req, res, next) {
  const user = readUserFromToken(req);
  if (!user) {
    next(createHttpError(401, '请先登录后再访问。'));
    return;
  }
  req.user = user;
  next();
}

module.exports = { optionalAuth, requireAuth };
