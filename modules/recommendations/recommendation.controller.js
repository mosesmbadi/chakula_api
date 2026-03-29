const service = require('./recommendation.service');

async function recommend(req, res, next) {
  try {
    const { mealType } = req.query;
    const result = await service.getRecommendation(req.user.userId, mealType);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function recommendAll(req, res, next) {
  try {
    const results = await service.getAllRecommendations(req.user.userId);
    res.json({ recommendations: results });
  } catch (err) {
    next(err);
  }
}

async function triggerGeneration(req, res, next) {
  try {
    // Fire off generation in the background, don't block the response
    service.generateForAllUsers().catch(err => {
      console.error('[Manual trigger] generation failed:', err.message);
    });
    res.json({ message: 'Recommendation generation started' });
  } catch (err) {
    next(err);
  }
}

module.exports = { recommend, recommendAll, triggerGeneration };
