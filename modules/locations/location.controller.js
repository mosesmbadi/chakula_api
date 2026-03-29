const service = require('./location.service');

async function getAllRegions(req, res, next) {
  try {
    const regions = await service.getAllRegions();
    res.json(regions);
  } catch (err) { next(err); }
}

async function getRegionById(req, res, next) {
  try {
    const region = await service.getRegionById(req.params.id);
    res.json(region);
  } catch (err) { next(err); }
}

async function resolveLocation(req, res, next) {
  try {
    const { lat, lng, name } = req.query;
    const result = await service.resolveLocation({
      lat: lat !== undefined ? parseFloat(lat) : undefined,
      lng: lng !== undefined ? parseFloat(lng) : undefined,
      name,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function getRegionFoods(req, res, next) {
  try {
    const foods = await service.getRegionFoods(req.params.id);
    res.json(foods);
  } catch (err) { next(err); }
}

async function createRegion(req, res, next) {
  try {
    const region = await service.createRegion(req.body);
    res.status(201).json(region);
  } catch (err) { next(err); }
}

async function addRegionFood(req, res, next) {
  try {
    const food = await service.addRegionFood(req.params.id, req.body);
    res.status(201).json(food);
  } catch (err) { next(err); }
}

module.exports = {
  getAllRegions,
  getRegionById,
  resolveLocation,
  getRegionFoods,
  createRegion,
  addRegionFood,
};
