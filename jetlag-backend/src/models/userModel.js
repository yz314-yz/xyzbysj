const { getDatabase } = require('./database');

function createUser({ username, passwordHash }) {
  const statement = getDatabase().prepare(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)'
  );
  const result = statement.run(username, passwordHash);
  return findUserById(result.lastInsertRowid);
}

function findUserByUsername(username) {
  return getDatabase()
    .prepare('SELECT id, username, password_hash AS passwordHash, created_at AS createdAt FROM users WHERE username = ?')
    .get(username);
}

function findUserById(id) {
  return getDatabase()
    .prepare('SELECT id, username, created_at AS createdAt FROM users WHERE id = ?')
    .get(id);
}

module.exports = { createUser, findUserById, findUserByUsername };
