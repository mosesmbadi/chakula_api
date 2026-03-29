const { Router } = require('express');
const ctrl = require('./user.controller');
const auth = require('../../core/middleware/authenticate');
const {
  validateRegister,
  validateLogin,
  validateBudget,
  validateDietaryPreferences,
  validateMealHistory,
  validateFeedback,
} = require('./user.validation');

const router = Router();

// ─── Public (auth) ────────────────────────────────────────
router.post('/register', validateRegister, ctrl.register);
router.post('/login', validateLogin, ctrl.login);
router.post('/refresh', ctrl.refresh);

// ─── Protected ────────────────────────────────────────────
router.use(auth);

router.post('/logout', ctrl.logout);

// Profile
router.get('/profile', ctrl.getProfile);
router.patch('/profile', ctrl.updateProfile);

// Budget
router.get('/budget', ctrl.getBudget);
router.put('/budget', validateBudget, ctrl.setBudget);

// Dietary preferences
router.get('/dietary-preferences', ctrl.getDietaryPreferences);
router.put('/dietary-preferences', validateDietaryPreferences, ctrl.setDietaryPreferences);

// Meal history
router.get('/meal-history', ctrl.getMealHistory);
router.post('/meal-history', validateMealHistory, ctrl.addMealHistory);

// Feedback
router.get('/feedback', ctrl.getFeedback);
router.post('/feedback', validateFeedback, ctrl.addFeedback);

module.exports = router;
