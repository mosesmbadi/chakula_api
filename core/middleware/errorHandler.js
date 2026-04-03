/**
 * Centralised error handler.
 */
const logger = require('../logger');

function errorHandler(err, req, res, _next) {
  if (err.isOperational) {
    logger.warn({ err, req: { method: req.method, url: req.url } }, err.message);
  } else {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
  }

  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({ error: err.message });
  }


  res.status(500).json({ error: 'Internal server error' });
}

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
