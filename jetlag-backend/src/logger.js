const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const { config } = require('./config');

fs.mkdirSync(config.logsDir, { recursive: true });

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(config.logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(config.logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '30d',
    }),
  ],
});

const httpLogStream = {
  write(message) {
    logger.http ? logger.http(message.trim()) : logger.info(message.trim());
  },
};

module.exports = { logger, httpLogStream };
