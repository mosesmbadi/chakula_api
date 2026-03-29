const jwt = require('jsonwebtoken');
const config = require('../config');
const redis = require('../redis');

const TOKEN_BLACKLIST_PREFIX = 'bl:';

/**
 * Generate access + refresh token pair.
 */
function generateTokens(payload) {
  const jti = payload.jti || require('uuid').v4();

  const accessToken = jwt.sign(
    { ...payload, jti },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry, algorithm: 'HS256' },
  );

  const refreshJti = require('uuid').v4();
  const refreshToken = jwt.sign(
    { userId: payload.userId, tokenType: 'refresh', jti: refreshJti },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry, algorithm: 'HS256' },
  );

  return {
    accessToken,
    refreshToken,
    refreshJti,
    expiresIn: { accessToken: config.jwt.accessExpiry, refreshToken: config.jwt.refreshExpiry },
  };
}

/**
 * Verify an access token. Throws on invalid / expired / blacklisted.
 */
async function verifyAccessToken(token) {
  const decoded = jwt.verify(token, config.jwt.accessSecret, {
    algorithms: ['HS256'],
  });

  const blacklisted = await redis.get(`${TOKEN_BLACKLIST_PREFIX}${decoded.jti || token}`);
  if (blacklisted) {
    throw new Error('Token has been revoked');
  }

  return decoded;
}

/**
 * Verify a refresh token.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret, {
    algorithms: ['HS256'],
  });
}

/**
 * Blacklist a token until its natural expiry.
 */
async function revokeToken(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.set(`${TOKEN_BLACKLIST_PREFIX}${decoded.jti || token}`, '1', 'EX', ttl);
    }
  } catch {
    // token already expired — nothing to revoke
  }
}

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken, revokeToken };
