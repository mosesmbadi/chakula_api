const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const hpp = require('hpp');
const config = require('./core/config');
const rateLimiter = require('./core/middleware/rateLimiter');
const { errorHandler } = require('./core/middleware/errorHandler');
const db = require('./core/database/db');
const redis = require('./core/redis');

// Route modules
const userRoutes = require('./modules/users/user.routes');
const locationRoutes = require('./modules/locations/location.routes');
const recommendationRoutes = require('./modules/recommendations/recommendation.routes');

const app = express();

// ─── Security & performance middleware ────────────────────
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(hpp());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(rateLimiter);

// ─── Health check ─────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ok', uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ status: 'degraded', error: err.message });
  }
});

// ─── API routes ───────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/recommendations', recommendationRoutes);

// ─── 404 ──────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Central error handler ────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────
const server = app.listen(config.port, () => {
  console.log(`Chakula API listening on port ${config.port} [${config.nodeEnv}]`);

  // In single-process mode (dev), start the scheduler here
  const cluster = require('node:cluster');
  if (!cluster.isWorker) {
    const { scheduleDailyAt } = require('./core/scheduler');
    const { generateForAllUsers } = require('./modules/recommendations/recommendation.service');
    scheduleDailyAt(0, 0, () => {
      generateForAllUsers().catch(err => {
        console.error('[Scheduler] Daily recommendation generation failed:', err.message);
      });
    });
  }
});

// ─── Graceful shutdown ────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(async () => {
    await db.close();
    redis.disconnect();
    process.exit(0);
  });
  // Force exit after 10 s
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
