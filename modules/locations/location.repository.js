const db = require('../../core/database/db');

async function getAllRegions() {
  const { rows } = await db.query(
    `SELECT id, name, country, description, cuisine_tags, updated_at
     FROM food_regions
     ORDER BY country, name`,
  );
  return rows;
}

async function getRegionById(id) {
  const { rows } = await db.query(
    `SELECT * FROM food_regions WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

async function findRegionByCoordinates(lat, lng) {
  // Find the region whose polygon/bounding box contains the point.
  // Falls back to nearest region by centroid distance.
  const { rows } = await db.query(
    `SELECT id, name, country, description, cuisine_tags,
            ST_Distance(
              ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
              ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
            ) AS distance_m
     FROM food_regions
     ORDER BY distance_m ASC
     LIMIT 1`,
    [lat, lng],
  );
  return rows[0] || null;
}

async function findRegionByName(name) {
  const { rows } = await db.query(
    `SELECT * FROM food_regions
     WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1
     ORDER BY name
     LIMIT 10`,
    [`%${name.toLowerCase()}%`],
  );
  return rows;
}

async function getRegionFoods(regionId) {
  const { rows } = await db.query(
    `SELECT rf.id, rf.food_name, rf.description, rf.avg_price, rf.currency, rf.is_staple, rf.tags
     FROM region_foods rf
     WHERE rf.region_id = $1
     ORDER BY rf.is_staple DESC, rf.food_name`,
    [regionId],
  );
  return rows;
}

async function createRegion(data) {
  const { rows } = await db.query(
    `INSERT INTO food_regions (name, country, description, cuisine_tags, center_lat, center_lng)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.name, data.country, data.description || null, data.cuisineTags || [], data.centerLat, data.centerLng],
  );
  return rows[0];
}

async function addRegionFood(regionId, data) {
  const { rows } = await db.query(
    `INSERT INTO region_foods (region_id, food_name, description, avg_price, currency, is_staple, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      regionId,
      data.foodName,
      data.description || null,
      data.avgPrice || 0,
      data.currency || 'KES',
      data.isStaple || false,
      data.tags || [],
    ],
  );
  return rows[0];
}

module.exports = {
  getAllRegions,
  getRegionById,
  findRegionByCoordinates,
  findRegionByName,
  getRegionFoods,
  createRegion,
  addRegionFood,
};
