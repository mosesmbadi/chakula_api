const redis = require('../../core/redis');
const config = require('../../core/config');
const db = require('../../core/database/db');
const logger = require('../../core/logger');
const { AppError } = require('../../core/middleware/errorHandler');

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const CACHE_PREFIX = 'rec:';
const KNOWLEDGE_BASE_URL = config.knowledgeBase.url;
const KNOWLEDGE_BASE_KEY = config.knowledgeBase.apiKey;

// ─── External API call ────────────────────────────────────

async function fetchFromKnowledgeBase({ region, budgetPerMealKes, dietaryGoals, excludeFoodIds, mealType, limit }) {
  const url = `${KNOWLEDGE_BASE_URL}/foods/recommend`;
  const res = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': KNOWLEDGE_BASE_KEY,
    },
    body: JSON.stringify({
      region: region || 'kenya',
      budget_per_meal_kes: budgetPerMealKes,
      dietary_goals: dietaryGoals || [],
      exclude_food_ids: excludeFoodIds || [],
      meal_type: mealType,
      limit: limit || 3,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Knowledge base returned ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Redis key helpers ────────────────────────────────────

function cacheKey(userId, mealType) {
  return `${CACHE_PREFIX}${userId}:${mealType}`;
}

function secondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000) || 86400;
}

// ─── Cache a user's recommendations ──────────────────────

async function cacheRecommendations(userId, mealType, data) {
  const ttl = secondsUntilMidnight();
  await redis.set(cacheKey(userId, mealType), JSON.stringify(data), 'EX', ttl);
}

async function getCachedRecommendations(userId, mealType) {
  const raw = await redis.get(cacheKey(userId, mealType));
  return raw ? JSON.parse(raw) : null;
}

// ─── Generate recommendations for one user ───────────────

async function generateForUser(userId) {
  // Fetch user's budget and dietary preferences
  const [budgetRow, prefRows, historyRows] = await Promise.all([
    db.query('SELECT daily_budget, currency FROM budget_settings WHERE user_id = $1', [userId]).then(r => r.rows[0]),
    db.query('SELECT preference FROM dietary_preferences WHERE user_id = $1', [userId]).then(r => r.rows.map(p => p.preference)),
    db.query(
      `SELECT meal_id FROM meal_history WHERE user_id = $1 AND eaten_at > NOW() - INTERVAL '7 days'`,
      [userId],
    ).then(r => r.rows.map(m => m.meal_id).filter(Boolean)),
  ]);

  // Budget split: breakfast 20%, lunch 40%, dinner 40%
  const BUDGET_WEIGHT = { breakfast: 0.2, lunch: 0.4, dinner: 0.4 };
  const dailyBudget = budgetRow ? parseFloat(budgetRow.daily_budget) : 900;

  const results = {};

  for (const mealType of MEAL_TYPES) {
    try {
      const budgetPerMeal = Math.floor(dailyBudget * BUDGET_WEIGHT[mealType]);
      const data = await fetchFromKnowledgeBase({
        region: 'kenya',
        budgetPerMealKes: budgetPerMeal,
        dietaryGoals: prefRows,
        excludeFoodIds: historyRows,
        mealType,
        limit: 5,
      });
      results[mealType] = data;
      await cacheRecommendations(userId, mealType, data);
    } catch (err) {
      logger.error({ err, userId, mealType }, 'Failed to fetch recommendations');
      results[mealType] = null;
    }
  }

  return results;
}

// ─── Generate for the current authenticated user (called by POST /generate) ──

async function generateForCurrentUser(userId, { region, budgetPerMealKes, dietaryGoals, excludeFoodIds, mealType, limit }) {
  if (!MEAL_TYPES.includes(mealType)) {
    throw new AppError(`Invalid meal type. Must be one of: ${MEAL_TYPES.join(', ')}`, 400);
  }

  const data = await fetchFromKnowledgeBase({ region, budgetPerMealKes, dietaryGoals, excludeFoodIds, mealType, limit });
  await cacheRecommendations(userId, mealType, data);
  return { mealType, recommendations: data };
}

// ─── Generate for ALL users (called by scheduler) ────────

async function generateForAllUsers() {
  const batchSize = 100;
  let offset = 0;
  let totalProcessed = 0;
  let totalFailed = 0;
  const userSummaries = [];

  logger.info('Starting daily recommendation generation');

  while (true) {
    const { rows: users } = await db.query(
      'SELECT id FROM users ORDER BY id LIMIT $1 OFFSET $2',
      [batchSize, offset],
    );

    if (users.length === 0) break;

    // Process batch with controlled concurrency (10 at a time)
    const concurrency = parseInt(process.env.REC_CONCURRENCY, 10) || 10;
    for (let i = 0; i < users.length; i += concurrency) {
      const batch = users.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map(u => generateForUser(u.id).then(r => ({ userId: u.id, meals: r }))),
      );
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          totalProcessed++;
          const { userId, meals } = r.value;
          const mealCounts = {};
          for (const [mealType, data] of Object.entries(meals)) {
            mealCounts[mealType] = Array.isArray(data) ? data.length : (data?.foods?.length ?? 0);
          }
          userSummaries.push({ userId, meals: mealCounts });
        } else {
          totalFailed++;
        }
      });
    }

    offset += batchSize;
  }

  logger.info({ totalProcessed, totalFailed }, 'Daily recommendation generation complete');
  return { totalProcessed, totalFailed, users: userSummaries };
}

// ─── Read recommendations (called by API) ────────────────

function currentMealType() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  return 'dinner';
}

async function getRecommendation(userId, mealType) {
  const type = mealType || currentMealType();
  if (!MEAL_TYPES.includes(type)) {
    throw new AppError(`Invalid meal type. Must be one of: ${MEAL_TYPES.join(', ')}`, 400);
  }

  let cached = await getCachedRecommendations(userId, type);

  // If no cache exists (new user, cache expired), generate on-the-fly
  if (!cached) {
    await generateForUser(userId);
    cached = await getCachedRecommendations(userId, type);
  }

  return { mealType: type, recommendations: cached };
}

async function getAllRecommendations(userId) {
  const results = {};
  let anyMissing = false;

  for (const type of MEAL_TYPES) {
    const cached = await getCachedRecommendations(userId, type);
    if (!cached) anyMissing = true;
    results[type] = cached;
  }

  // If any meal type is missing, regenerate all
  if (anyMissing) {
    await generateForUser(userId);
    for (const type of MEAL_TYPES) {
      results[type] = await getCachedRecommendations(userId, type);
    }
  }

  return results;
}

// ─── Accept food suggestions ─────────────────────────────

const userRepo = require('../users/user.repository');

async function acceptMealSuggestion(userId, { mealType, foods, imagePath }) {
  if (!MEAL_TYPES.includes(mealType)) {
    throw new AppError(`Invalid meal type. Must be one of: ${MEAL_TYPES.join(', ')}`, 400);
  }
  if (!Array.isArray(foods) || foods.length === 0) {
    throw new AppError('foods must be a non-empty array', 400);
  }

  const entries = await Promise.all(
    foods.map(({ food_id, food_name, cost, currency }) => {
      if (!food_name || cost === undefined || isNaN(Number(cost))) {
        throw new AppError('Each food must have food_name and a numeric cost', 400);
      }
      return userRepo.addMealHistory(userId, {
        mealId: food_id || null,
        mealName: food_name,
        cost: Number(cost),
        currency: currency || 'KES',
        imagePath: imagePath || null,
      });
    }),
  );

  return { mealType, accepted: entries };
}

async function acceptDayPlan(userId, { plan }) {
  if (!plan || typeof plan !== 'object') {
    throw new AppError('plan must be an object with meal types as keys', 400);
  }

  const results = {};

  for (const mealType of Object.keys(plan)) {
    if (!MEAL_TYPES.includes(mealType)) {
      throw new AppError(`Invalid meal type "${mealType}". Must be one of: ${MEAL_TYPES.join(', ')}`, 400);
    }
    const foods = plan[mealType];
    if (!Array.isArray(foods) || foods.length === 0) {
      throw new AppError(`Foods for "${mealType}" must be a non-empty array`, 400);
    }
    const { accepted } = await acceptMealSuggestion(userId, { mealType, foods });
    results[mealType] = accepted;
  }

  return { accepted: results };
}

// ─── Public (unauthenticated) recommendation ─────────────

async function getPublicRecommendation(mealType, { budgetPerMealKes, region }) {
  const type = mealType || currentMealType();
  if (!MEAL_TYPES.includes(type)) {
    throw new AppError(`Invalid meal type. Must be one of: ${MEAL_TYPES.join(', ')}`, 400);
  }
  if (!budgetPerMealKes || isNaN(Number(budgetPerMealKes))) {
    throw new AppError('budget is required and must be a number', 400);
  }
  if (!region || typeof region !== 'string') {
    throw new AppError('region is required', 400);
  }

  const data = await fetchFromKnowledgeBase({
    region,
    budgetPerMealKes: Number(budgetPerMealKes),
    mealType: type,
  });

  return { mealType: type, recommendations: data };
}

module.exports = {
  generateForUser,
  generateForCurrentUser,
  generateForAllUsers,
  getRecommendation,
  getAllRecommendations,
  getPublicRecommendation,
  acceptMealSuggestion,
  acceptDayPlan,
  MEAL_TYPES,
};
