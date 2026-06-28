const fs = require('fs');
const multer = require('multer');

const { config } = require('../config');
const { createHttpError } = require('./errors');
const { logger } = require('../logger');

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

module.exports = { cleanupFiles, upload };
