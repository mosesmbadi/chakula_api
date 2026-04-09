const redis = require('../../core/redis');
const repo = require('./meal-history.repository');
const logger = require('../../core/logger');

const CACHE_TTL = 300; // 5 minutes
const CACHE_PREFIX = 'mh:list:';

function buildCacheKey(region, subRegion, page, limit) {
  const r = region ? region.toLowerCase() : '_';
  const s = subRegion ? subRegion.toLowerCase() : '_';
  return `${CACHE_PREFIX}r:${r}:s:${s}:p:${page}:l:${limit}`;
}

async function getMealHistory({ region, subRegion, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const cacheKey = buildCacheKey(region, subRegion, page, limit);

  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, 'meal history cache hit');
    return JSON.parse(cached);
  }

  const { data, total } = await repo.getMealHistoryByLocation(
    { region, subRegion },
    { limit, offset },
  );

  const result = {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
  return result;
}

async function vote(id, direction) {
  const updated = await repo.voteOnMeal(id, direction);
  if (!updated) {
    const { AppError } = require('../../core/middleware/errorHandler');
    throw new AppError('Meal history entry not found', 404);
  }

  // Bust all list cache pages so vote counts are reflected immediately
  const keys = await redis.keys(`${CACHE_PREFIX}*`);
  if (keys.length) await redis.del(keys);

  return updated;
}

module.exports = { getMealHistory, vote };
