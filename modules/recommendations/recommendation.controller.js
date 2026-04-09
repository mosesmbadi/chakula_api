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
    const { region, budget_per_meal_kes, dietary_goals, exclude_food_ids, meal_type, limit } = req.body;
    const result = await service.generateForCurrentUser(req.user.userId, {
      region,
      budgetPerMealKes: budget_per_meal_kes,
      dietaryGoals: dietary_goals,
      excludeFoodIds: exclude_food_ids,
      mealType: meal_type,
      limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function acceptMeal(req, res, next) {
  try {
    let { mealType, foods } = req.body;
    // When sent as multipart/form-data, foods arrives as a JSON string
    if (typeof foods === 'string') {
      try { foods = JSON.parse(foods); } catch { /* service validates foods */ }
    }
    const imagePath = req.fileUrl || null;
    const result = await service.acceptMealSuggestion(req.user.userId, { mealType, foods, imagePath });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function acceptPlan(req, res, next) {
  try {
    const { plan } = req.body;
    const result = await service.acceptDayPlan(req.user.userId, { plan });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { recommend, recommendAll, triggerGeneration, acceptMeal, acceptPlan };
