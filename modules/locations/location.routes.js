const { Router } = require('express');
const ctrl = require('./location.controller');
const auth = require('../../core/middleware/authenticate');
const { validateCreateRegion, validateAddFood, validateRegionId } = require('./location.validation');

const router = Router();

// Public — anyone can browse regions
router.get('/regions', ctrl.getAllRegions);
router.get('/regions/:id', validateRegionId, ctrl.getRegionById);
router.get('/regions/:id/foods', validateRegionId, ctrl.getRegionFoods);
router.get('/resolve', ctrl.resolveLocation);

// Protected — admin-style region management
router.use(auth);
router.post('/regions', validateCreateRegion, ctrl.createRegion);
router.post('/regions/:id/foods', validateAddFood, ctrl.addRegionFood);

module.exports = router;
