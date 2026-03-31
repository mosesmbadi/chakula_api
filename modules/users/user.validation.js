const { AppError } = require('../../core/middleware/errorHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_DIETARY_GOALS = ['gain_weight', 'lose_weight', 'high-protein', 'low-carb', 'high-fibre'];

function validateRegister(req, _res, next) {
  const { email, password, name, region, subregion, dietaryGoals, dailyBudget } = req.body;
  if (!email || !EMAIL_RE.test(email)) throw new AppError('Valid email is required');
  if (!password || password.length < 8) throw new AppError('Password must be at least 8 characters');
  if (!name || name.trim().length < 1) throw new AppError('Name is required');

  if (region !== undefined && (typeof region !== 'string' || region.trim().length === 0)) {
    throw new AppError('region must be a non-empty string');
  }
  if (subregion !== undefined && (typeof subregion !== 'string' || subregion.trim().length === 0)) {
    throw new AppError('subregion must be a non-empty string');
  }

  if (dietaryGoals !== undefined) {
    if (!Array.isArray(dietaryGoals)) throw new AppError('dietaryGoals must be an array');
    const invalid = dietaryGoals.filter((g) => !VALID_DIETARY_GOALS.includes(g));
    if (invalid.length) throw new AppError(`Invalid dietary goals: ${invalid.join(', ')}. Valid: ${VALID_DIETARY_GOALS.join(', ')}`);
  }

  if (dailyBudget !== undefined) {
    if (typeof dailyBudget !== 'number' || dailyBudget < 0) {
      throw new AppError('dailyBudget must be a non-negative number');
    }
  }

  next();
}

function validateLogin(req, _res, next) {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required');
  next();
}

function validateBudget(req, _res, next) {
  const { dailyBudget } = req.body;
  if (dailyBudget === undefined || typeof dailyBudget !== 'number' || dailyBudget < 0) {
    throw new AppError('dailyBudget must be a non-negative number');
  }
  next();
}

function validateDietaryPreferences(req, _res, next) {
  const { preferences } = req.body;
  if (!Array.isArray(preferences)) throw new AppError('preferences must be an array of strings');
  if (preferences.some((p) => typeof p !== 'string' || p.trim().length === 0)) {
    throw new AppError('Each preference must be a non-empty string');
  }
  next();
}

function validateMealHistory(req, _res, next) {
  const { mealName, cost } = req.body;
  if (!mealName || typeof mealName !== 'string') throw new AppError('mealName is required');
  if (cost === undefined || typeof cost !== 'number' || cost < 0) {
    throw new AppError('cost must be a non-negative number');
  }
  next();
}

function validateFeedback(req, _res, next) {
  const { rating } = req.body;
  if (rating === undefined || typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new AppError('rating must be a number between 1 and 5');
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateBudget,
  validateDietaryPreferences,
  validateMealHistory,
  validateFeedback,
};
