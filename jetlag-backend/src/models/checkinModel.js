const { getDatabase } = require('./database');

function toCheckin(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    diagnosisId: row.diagnosisId,
    day: row.day,
    dietDone: Boolean(row.dietDone),
    exerciseDone: Boolean(row.exerciseDone),
    sleepDone: Boolean(row.sleepDone),
    rating: row.rating,
    note: row.note || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function summarizeCheckins(items) {
  const ratings = items.map((item) => item.rating).filter((rating) => Number.isFinite(rating));
  return {
    totalDays: 7,
    completedDays: items.length,
    averageRating: ratings.length
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : null,
    latestDay: items.length ? items[items.length - 1].day : null,
  };
}

function listCheckinsByDiagnosis(userId, diagnosisId) {
  return getDatabase()
    .prepare(`
      SELECT
        id,
        user_id AS userId,
        diagnosis_id AS diagnosisId,
        day,
        diet_done AS dietDone,
        exercise_done AS exerciseDone,
        sleep_done AS sleepDone,
        rating,
        note,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM checkins
      WHERE user_id = ? AND diagnosis_id = ?
      ORDER BY day ASC
    `)
    .all(userId, diagnosisId)
    .map(toCheckin);
}

function findCheckin(userId, diagnosisId, day) {
  const row = getDatabase()
    .prepare(`
      SELECT
        id,
        user_id AS userId,
        diagnosis_id AS diagnosisId,
        day,
        diet_done AS dietDone,
        exercise_done AS exerciseDone,
        sleep_done AS sleepDone,
        rating,
        note,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM checkins
      WHERE user_id = ? AND diagnosis_id = ? AND day = ?
    `)
    .get(userId, diagnosisId, day);
  return toCheckin(row);
}

function upsertCheckin({ userId, diagnosisId, day, dietDone, exerciseDone, sleepDone, rating = null, note = '' }) {
  getDatabase()
    .prepare(`
      INSERT INTO checkins (
        user_id,
        diagnosis_id,
        day,
        diet_done,
        exercise_done,
        sleep_done,
        rating,
        note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, diagnosis_id, day) DO UPDATE SET
        diet_done = excluded.diet_done,
        exercise_done = excluded.exercise_done,
        sleep_done = excluded.sleep_done,
        rating = excluded.rating,
        note = excluded.note,
        updated_at = datetime('now')
    `)
    .run(
      userId,
      diagnosisId,
      day,
      dietDone ? 1 : 0,
      exerciseDone ? 1 : 0,
      sleepDone ? 1 : 0,
      rating,
      note
    );

  return findCheckin(userId, diagnosisId, day);
}

module.exports = {
  listCheckinsByDiagnosis,
  summarizeCheckins,
  upsertCheckin,
};
