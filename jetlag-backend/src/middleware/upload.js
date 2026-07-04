const fs = require('fs');
const multer = require('multer');

const { config } = require('../config');
const { createHttpError } = require('./errors');
const { logger } = require('../logger');

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SIGNATURE_READ_BYTES = 16;

function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12
    && buffer.slice(0, 4).toString('ascii') === 'RIFF'
    && buffer.slice(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

fs.mkdirSync(config.uploadsDir, { recursive: true });

const upload = multer({
  dest: config.uploadsDir,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (allowedImageTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(createHttpError(415, '仅支持 JPG、PNG 或 WEBP 图片。'));
  },
});

function cleanupFiles(files) {
  Object.values(files || {}).flat().forEach((file) => {
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      logger.warn('临时上传文件清理失败：' + error.message);
    }
  });
}

function validateUploadedImages(req, res, next) {
  const files = Object.values(req.files || {}).flat();
  try {
    files.forEach((file) => {
      const fd = fs.openSync(file.path, 'r');
      try {
        const buffer = Buffer.alloc(SIGNATURE_READ_BYTES);
        const bytesRead = fs.readSync(fd, buffer, 0, SIGNATURE_READ_BYTES, 0);
        const detectedType = detectImageType(buffer.subarray(0, bytesRead));
        if (!detectedType || detectedType !== file.mimetype) {
          throw createHttpError(415, '图片文件内容与类型不匹配，请上传真实 JPG、PNG 或 WEBP 图片。');
        }
      } finally {
        fs.closeSync(fd);
      }
    });
    next();
  } catch (error) {
    cleanupFiles(req.files);
    next(error);
  }
}

module.exports = { cleanupFiles, upload, validateUploadedImages };
