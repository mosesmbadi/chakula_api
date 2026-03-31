const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const redis = require('../redis');

/**
 * Strict IP-based rate limiter for unauthenticated public endpoints.
 * 20 requests per hour per IP.
 */
const publicLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Public endpoints are limited to 20 requests per hour.' },
  keyGenerator: (req) => `public:${req.ip}`,
});

module.exports = publicLimiter;
