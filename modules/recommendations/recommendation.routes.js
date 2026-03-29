const { Router } = require('express');
const ctrl = require('./recommendation.controller');
const auth = require('../../core/middleware/authenticate');

const router = Router();

// All recommendation endpoints require authentication
router.use(auth);

// GET /api/recommendations/foods/recommend?mealType=lunch
router.get('/foods/recommend', ctrl.recommend);

// GET /api/recommendations/foods/recommend/all
router.get('/foods/recommend/all', ctrl.recommendAll);

// POST /api/recommendations/generate — manually trigger the daily job
router.post('/generate', ctrl.triggerGeneration);

module.exports = router;
