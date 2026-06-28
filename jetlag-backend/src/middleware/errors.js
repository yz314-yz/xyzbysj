const multer = require('multer');
const { ZodError } = require('zod');

const { logger } = require('../logger');

function createHttpError(statusCode, publicMessage) {
  const error = new Error(publicMessage);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  return error;
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: '接口不存在。' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  let statusCode = error.statusCode || error.status || 500;
  let message = error.publicMessage;

  if (error instanceof multer.MulterError) {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = error.code === 'LIMIT_FILE_SIZE'
      ? '单张图片不能超过 8MB。'
      : '上传图片格式不正确。';
  }

  if (error instanceof ZodError) {
    statusCode = 400;
    message = error.issues[0]?.message || '请求参数不正确。';
  }

  if (error.type === 'entity.too.large') {
    statusCode = 413;
    message = '请求内容过大。';
  }

  if (!message) {
    message = statusCode >= 500 ? '服务暂时不可用，请稍后再试。' : '请求参数不正确。';
  }

  if (statusCode >= 500) {
    logger.error('全局错误处理', { error: error.stack || error.message });
  } else {
    logger.warn('请求被拒绝：' + message);
  }

  res.status(statusCode).json({ success: false, error: message });
}

module.exports = { createHttpError, errorHandler, notFoundHandler };
