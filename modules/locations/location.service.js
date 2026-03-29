const repo = require('./location.repository');
const { AppError } = require('../../core/middleware/errorHandler');

async function getAllRegions() {
  return repo.getAllRegions();
}

async function getRegionById(id) {
  const region = await repo.getRegionById(id);
  if (!region) throw new AppError('Region not found', 404);
  return region;
}

async function resolveLocation({ lat, lng, name }) {
  if (lat !== undefined && lng !== undefined) {
    const region = await repo.findRegionByCoordinates(lat, lng);
    if (!region) throw new AppError('No food region found near those coordinates', 404);
    return region;
  }
  if (name) {
    const regions = await repo.findRegionByName(name);
    if (regions.length === 0) throw new AppError('No food region matches that name', 404);
    return regions;
  }
  throw new AppError('Provide lat/lng or a region name', 400);
}

async function getRegionFoods(regionId) {
  await getRegionById(regionId); // ensure exists
  return repo.getRegionFoods(regionId);
}

async function createRegion(data) {
  return repo.createRegion(data);
}

async function addRegionFood(regionId, data) {
  await getRegionById(regionId);
  return repo.addRegionFood(regionId, data);
}

module.exports = {
  getAllRegions,
  getRegionById,
  resolveLocation,
  getRegionFoods,
  createRegion,
  addRegionFood,
};
