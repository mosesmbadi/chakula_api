const { AppError } = require('../../core/middleware/errorHandler');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateRegionId(req, _res, next) {
  if (req.params.id && !UUID_RE.test(req.params.id)) {
    throw new AppError('Invalid region id', 400);
  }
  next();
}

function validateCreateRegion(req, _res, next) {
  const { name, country, centerLat, centerLng } = req.body;
  if (!name || typeof name !== 'string') throw new AppError('name is required');
  if (!country || typeof country !== 'string') throw new AppError('country is required');
  if (centerLat === undefined || typeof centerLat !== 'number') throw new AppError('centerLat is required');
  if (centerLng === undefined || typeof centerLng !== 'number') throw new AppError('centerLng is required');
  next();
}

function validateAddFood(req, _res, next) {
  const { foodName } = req.body;
  if (!foodName || typeof foodName !== 'string') throw new AppError('foodName is required');
  next();
}

module.exports = { validateCreateRegion, validateAddFood, validateRegionId };
