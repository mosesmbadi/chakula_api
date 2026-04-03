const { Router } = require('express');
const ctrl = require('./recommendation.controller');
const auth = require('../../core/middleware/authenticate');
const { uploadMealImage } = require('../../core/middleware/upload');

const router = Router();

// All recommendation endpoints require authentication
router.use(auth);

// GET /api/recommendations/foods/recommend?mealType=lunch
router.get('/foods/recommend', ctrl.recommend);

// GET /api/recommendations/foods/recommend/all
router.get('/foods/recommend/all', ctrl.recommendAll);

// POST /api/recommendations/generate — manually trigger the daily job
router.post('/generate', ctrl.triggerGeneration);

// POST /api/recommendations/accept — accept foods for a single meal type
// multipart/form-data fields: mealType (string), foods (JSON string), image (file, optional)
router.post('/accept', uploadMealImage(), ctrl.acceptMeal);

// POST /api/recommendations/accept/plan — accept the full day plan
router.post('/accept/plan', ctrl.acceptPlan);

module.exports = router;
