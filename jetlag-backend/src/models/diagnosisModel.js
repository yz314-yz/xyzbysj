const { getDatabase } = require('./database');

function toHistoryRow(row) {
  if (!row) return null;
  const result = JSON.parse(row.resultJson);
  return {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    symptoms: JSON.parse(row.symptomsJson),
    profile: JSON.parse(row.profileJson),
    result,
    summary: {
      constitution: result.constitution?.primary || '',
      confidence: result.constitution?.confidence || 0,
      meridian: result.meridian?.name || '',
    },
  };
}

function createDiagnosis({ userId = null, symptoms, profile, result }) {
  const statement = getDatabase().prepare(`
    INSERT INTO diagnoses (user_id, symptoms_json, profile_json, result_json)
    VALUES (?, ?, ?, ?)
  `);
  const saved = statement.run(
    userId,
    JSON.stringify(symptoms),
    JSON.stringify(profile),
    JSON.stringify(result)
  );
  return findDiagnosisById(saved.lastInsertRowid, userId);
}

function findDiagnosisById(id, userId) {
  const row = getDatabase()
    .prepare(`
      SELECT
        id,
        user_id AS userId,
        symptoms_json AS symptomsJson,
        profile_json AS profileJson,
        result_json AS resultJson,
        created_at AS createdAt
      FROM diagnoses
      WHERE id = ? AND user_id = ?
    `)
    .get(id, userId);
  return toHistoryRow(row);
}

function listDiagnosesByUser(userId) {
  return getDatabase()
    .prepare(`
      SELECT
        id,
        user_id AS userId,
        symptoms_json AS symptomsJson,
        profile_json AS profileJson,
        result_json AS resultJson,
        created_at AS createdAt
      FROM diagnoses
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 50
    `)
    .all(userId)
    .map(toHistoryRow);
}

module.exports = { createDiagnosis, findDiagnosisById, listDiagnosesByUser };
