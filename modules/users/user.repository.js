const db = require('../../core/database/db');

// ─── Profile ──────────────────────────────────────────────

async function createUser({ email, passwordHash, name, phone, locationId, region, subregion }) {
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, name, phone, location_id, region, subregion)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, name, phone, location_id, region, subregion, created_at`,
    [email, passwordHash, name, phone || null, locationId || null, region || null, subregion || null],
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await db.query(
    `SELECT id, email, password_hash, name, phone, location_id, created_at
     FROM users WHERE email = $1`,
    [email],
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await db.query(
    `SELECT id, email, name, phone, location_id, created_at
     FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

async function updateProfile(id, fields) {
  const allowed = ['name', 'phone', 'location_id'];
  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${idx++}`);
      values.push(fields[key]);
    }
  }
  if (sets.length === 0) return findById(id);

  values.push(id);
  const { rows } = await db.query(
    `UPDATE users SET ${sets.join(', ')}, updated_at = NOW()
     WHERE id = $${idx}
     RETURNING id, email, name, phone, location_id, created_at, updated_at`,
    values,
  );
  return rows[0];
}

// ─── Budget Settings ──────────────────────────────────────

async function upsertBudget(userId, { dailyBudget, currency, regionPriceIndex }) {
  const { rows } = await db.query(
    `INSERT INTO budget_settings (user_id, daily_budget, currency, region_price_index)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id)
     DO UPDATE SET daily_budget = $2, currency = $3, region_price_index = $4, updated_at = NOW()
     RETURNING *`,
    [userId, dailyBudget, currency || 'KES', regionPriceIndex || 1.0],
  );
  return rows[0];
}

async function getBudget(userId) {
  const { rows } = await db.query(
    `SELECT * FROM budget_settings WHERE user_id = $1`,
    [userId],
  );
  return rows[0] || null;
}

// ─── Dietary Preferences ──────────────────────────────────

async function setDietaryPreferences(userId, preferences) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM dietary_preferences WHERE user_id = $1', [userId]);

    if (preferences.length > 0) {
      const placeholders = preferences
        .map((_, i) => `($1, $${i + 2})`)
        .join(', ');
      const values = [userId, ...preferences];
      await client.query(
        `INSERT INTO dietary_preferences (user_id, preference) VALUES ${placeholders}`,
        values,
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getDietaryPreferences(userId) {
  const { rows } = await db.query(
    `SELECT preference FROM dietary_preferences WHERE user_id = $1`,
    [userId],
  );
  return rows.map((r) => r.preference);
}

// ─── Meal History ─────────────────────────────────────────

async function addMealHistory(userId, { mealId, mealName, cost, currency, rating, notes, imagePath }) {
  const { rows } = await db.query(
    `INSERT INTO meal_history (user_id, meal_id, meal_name, cost, currency, rating, notes, image_path)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, mealId || null, mealName, cost, currency || 'KES', rating || null, notes || null, imagePath || null],
  );
  return rows[0];
}

async function getMealHistory(userId, { limit = 20, offset = 0 } = {}) {
  const { rows } = await db.query(
    `SELECT * FROM meal_history
     WHERE user_id = $1
     ORDER BY eaten_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return rows;
}

// ─── Feedback ─────────────────────────────────────────────

async function addFeedback(userId, { mealHistoryId, rating, comment }) {
  const { rows } = await db.query(
    `INSERT INTO feedback (user_id, meal_history_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, mealHistoryId || null, rating, comment || null],
  );
  return rows[0];
}

async function getFeedback(userId, { limit = 20, offset = 0 } = {}) {
  const { rows } = await db.query(
    `SELECT * FROM feedback
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return rows;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateProfile,
  upsertBudget,
  getBudget,
  setDietaryPreferences,
  getDietaryPreferences,
  addMealHistory,
  getMealHistory,
  addFeedback,
  getFeedback,
};
