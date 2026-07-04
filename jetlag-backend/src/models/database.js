const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const { config } = require('../config');
const { logger } = require('../logger');

let db;

function getDatabase() {
  if (!db) {
    fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
    db = new Database(config.databasePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function ensureDatabase() {
  const database = getDatabase();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diagnoses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      symptoms_json TEXT NOT NULL,
      profile_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      diagnosis_id INTEGER NOT NULL,
      day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 7),
      diet_done INTEGER NOT NULL DEFAULT 0,
      exercise_done INTEGER NOT NULL DEFAULT 0,
      sleep_done INTEGER NOT NULL DEFAULT 0,
      rating INTEGER CHECK (rating BETWEEN 1 AND 5),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, diagnosis_id, day),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id) ON DELETE CASCADE
    );
  `);

  logger.info('SQLite 数据库已就绪：' + config.databasePath);
  return database;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { closeDatabase, ensureDatabase, getDatabase };
