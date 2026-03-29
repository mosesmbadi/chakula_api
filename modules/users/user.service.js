const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const repo = require('./user.repository');
const db = require('../../core/database/db');
const { generateTokens, verifyRefreshToken, revokeToken } = require('../../core/auth/jwt');
const { AppError } = require('../../core/middleware/errorHandler');

const SALT_ROUNDS = 10;

// ─── Helpers ──────────────────────────────────────────────

async function storeRefreshToken(userId, jti, expiresAt) {
  await db.query(
    `INSERT INTO refresh_tokens (user_id, jti, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, jti, expiresAt],
  );
}

async function revokeRefreshTokenByJti(jti) {
  await db.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE jti = $1 AND revoked_at IS NULL`,
    [jti],
  );
}

async function isRefreshTokenValid(jti) {
  const { rows } = await db.query(
    `SELECT 1 FROM refresh_tokens WHERE jti = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [jti],
  );
  return rows.length > 0;
}

// ─── Auth ─────────────────────────────────────────────────

async function register({ email, password, name, phone, locationId, dietaryGoals, dailyBudget }) {
  const existing = await repo.findByEmail(email);
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await repo.createUser({ email, passwordHash, name, phone, locationId });

  if (dietaryGoals && dietaryGoals.length > 0) {
    await repo.setDietaryPreferences(user.id, dietaryGoals);
  }
  if (dailyBudget !== undefined) {
    await repo.upsertBudget(user.id, { dailyBudget });
  }

  const { accessToken, refreshToken, refreshJti, expiresIn } = generateTokens({ userId: user.id, email: user.email, jti: uuidv4() });
  const decoded = require('jsonwebtoken').decode(refreshToken);
  await storeRefreshToken(user.id, refreshJti, new Date(decoded.exp * 1000));
  return { user, accessToken, refreshToken, expiresIn };
}

async function login({ email, password }) {
  const user = await repo.findByEmail(email);
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const { accessToken, refreshToken, refreshJti, expiresIn } = generateTokens({ userId: user.id, email: user.email, jti: uuidv4() });
  const decoded = require('jsonwebtoken').decode(refreshToken);
  await storeRefreshToken(user.id, refreshJti, new Date(decoded.exp * 1000));
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken, expiresIn };
}

async function refresh(refreshTokenStr) {
  const decoded = verifyRefreshToken(refreshTokenStr);
  if (!decoded.jti || !(await isRefreshTokenValid(decoded.jti))) {
    throw new AppError('Refresh token has been revoked', 401);
  }

  const user = await repo.findById(decoded.userId);
  if (!user) throw new AppError('User not found', 404);

  // Rotate: revoke old refresh token in DB + Redis, issue new pair
  await revokeRefreshTokenByJti(decoded.jti);
  await revokeToken(refreshTokenStr);

  const { accessToken, refreshToken, refreshJti, expiresIn } = generateTokens({ userId: user.id, email: user.email, jti: uuidv4() });
  const newDecoded = require('jsonwebtoken').decode(refreshToken);
  await storeRefreshToken(user.id, refreshJti, new Date(newDecoded.exp * 1000));
  return { accessToken, refreshToken, expiresIn };
}

async function logout(accessToken, refreshTokenStr) {
  await revokeToken(accessToken);
  if (refreshTokenStr) {
    const decoded = require('jsonwebtoken').decode(refreshTokenStr);
    if (decoded?.jti) await revokeRefreshTokenByJti(decoded.jti);
    await revokeToken(refreshTokenStr);
  }
}

// ─── Profile ──────────────────────────────────────────────

async function getProfile(userId) {
  const user = await repo.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function updateProfile(userId, fields) {
  return repo.updateProfile(userId, fields);
}

// ─── Budget ───────────────────────────────────────────────

async function setBudget(userId, data) {
  return repo.upsertBudget(userId, data);
}

async function getBudget(userId) {
  const budget = await repo.getBudget(userId);
  if (!budget) throw new AppError('Budget not configured', 404);
  return budget;
}

// ─── Dietary Preferences ──────────────────────────────────

async function setDietaryPreferences(userId, preferences) {
  await repo.setDietaryPreferences(userId, preferences);
  return repo.getDietaryPreferences(userId);
}

async function getDietaryPreferences(userId) {
  return repo.getDietaryPreferences(userId);
}

// ─── Meal History ─────────────────────────────────────────

async function addMealHistory(userId, data) {
  return repo.addMealHistory(userId, data);
}

async function getMealHistory(userId, pagination) {
  return repo.getMealHistory(userId, pagination);
}

// ─── Feedback ─────────────────────────────────────────────

async function addFeedback(userId, data) {
  return repo.addFeedback(userId, data);
}

async function getFeedback(userId, pagination) {
  return repo.getFeedback(userId, pagination);
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
