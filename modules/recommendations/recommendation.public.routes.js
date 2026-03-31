const { Router } = require('express');
const service = require('./recommendation.service');
const publicLimiter = require('../../core/middleware/publicRateLimiter');

const router = Router();

router.use(publicLimiter);

// GET /api/public/recommendations/foods/recommend?mealType=dinner&budget=300&region=kenya
router.get('/foods/recommend', async (req, res, next) => {
  try {
    const { mealType, budget, region } = req.query;
    const result = await service.getPublicRecommendation(mealType, {
      budgetPerMealKes: budget,
      region,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
