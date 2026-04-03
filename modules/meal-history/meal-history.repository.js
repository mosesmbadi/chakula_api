const db = require('../../core/database/db');

async function getMealHistoryByLocation({ region, subRegion } = {}, { limit = 20, offset = 0 } = {}) {
  const r = region || null;
  const s = subRegion || null;

  const [dataRes, countRes] = await Promise.all([
    db.query(
      `SELECT mh.id, mh.user_id, mh.meal_name, mh.cost, mh.currency,
              mh.rating, mh.notes, mh.eaten_at,
              mh.upvotes, mh.downvotes,
              u.region, u.subregion
       FROM meal_history mh
       JOIN users u ON u.id = mh.user_id
       WHERE ($1::text IS NULL OR u.region ILIKE $1)
         AND ($2::text IS NULL OR u.subregion ILIKE $2)
       ORDER BY mh.eaten_at DESC
       LIMIT $3 OFFSET $4`,
      [r, s, limit, offset],
    ),
    db.query(
      `SELECT COUNT(*) AS total
       FROM meal_history mh
       JOIN users u ON u.id = mh.user_id
       WHERE ($1::text IS NULL OR u.region ILIKE $1)
         AND ($2::text IS NULL OR u.subregion ILIKE $2)`,
      [r, s],
    ),
  ]);

  return {
    data: dataRes.rows,
    total: parseInt(countRes.rows[0].total, 10),
  };
}

async function voteOnMeal(id, direction) {
  const column = direction === 'upvote' ? 'upvotes' : 'downvotes';
  const { rows } = await db.query(
    `UPDATE meal_history
     SET ${column} = ${column} + 1
     WHERE id = $1
     RETURNING id, meal_name, upvotes, downvotes`,
    [id],
  );
  return rows[0] || null;
}

module.exports = { getMealHistoryByLocation, voteOnMeal };
