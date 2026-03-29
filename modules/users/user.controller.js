const service = require('./user.service');

// ─── Auth ─────────────────────────────────────────────────

async function register(req, res, next) {
  try {
    const result = await service.register(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
    const tokens = await service.refresh(refreshToken);
    res.json(tokens);
  } catch (err) { next(err); }
}

async function logout(req, res, next) {
  try {
    const accessToken = req.headers.authorization?.slice(7);
    const { refreshToken } = req.body;
    await service.logout(accessToken, refreshToken);
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
}

// ─── Profile ──────────────────────────────────────────────

async function getProfile(req, res, next) {
  try {
    const user = await service.getProfile(req.user.userId);
    res.json(user);
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const user = await service.updateProfile(req.user.userId, req.body);
    res.json(user);
  } catch (err) { next(err); }
}

// ─── Budget ───────────────────────────────────────────────

async function setBudget(req, res, next) {
  try {
    const budget = await service.setBudget(req.user.userId, req.body);
    res.json(budget);
  } catch (err) { next(err); }
}

async function getBudget(req, res, next) {
  try {
    const budget = await service.getBudget(req.user.userId);
    res.json(budget);
  } catch (err) { next(err); }
}

// ─── Dietary Preferences ──────────────────────────────────

async function setDietaryPreferences(req, res, next) {
  try {
    const prefs = await service.setDietaryPreferences(req.user.userId, req.body.preferences);
    res.json({ preferences: prefs });
  } catch (err) { next(err); }
}

async function getDietaryPreferences(req, res, next) {
  try {
    const prefs = await service.getDietaryPreferences(req.user.userId);
    res.json({ preferences: prefs });
  } catch (err) { next(err); }
}

// ─── Meal History ─────────────────────────────────────────

async function addMealHistory(req, res, next) {
  try {
    const entry = await service.addMealHistory(req.user.userId, req.body);
    res.status(201).json(entry);
  } catch (err) { next(err); }
}

async function getMealHistory(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const entries = await service.getMealHistory(req.user.userId, { limit, offset });
    res.json(entries);
  } catch (err) { next(err); }
}

// ─── Feedback ─────────────────────────────────────────────

async function addFeedback(req, res, next) {
  try {
    const fb = await service.addFeedback(req.user.userId, req.body);
    res.status(201).json(fb);
  } catch (err) { next(err); }
}

async function getFeedback(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const entries = await service.getFeedback(req.user.userId, { limit, offset });
    res.json(entries);
  } catch (err) { next(err); }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getProfile,
  updateProfile,
  setBudget,
  getBudget,
  setDietaryPreferences,
  getDietaryPreferences,
  addMealHistory,
  getMealHistory,
  addFeedback,
  getFeedback,
};
