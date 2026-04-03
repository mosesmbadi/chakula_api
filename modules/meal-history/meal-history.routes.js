const { Router } = require('express');
const auth = require('../../core/middleware/authenticate');
const ctrl = require('./meal-history.controller');
const { AppError } = require('../../core/middleware/errorHandler');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateVote(req, _res, next) {
  if (!UUID_RE.test(req.params.id)) throw new AppError('Invalid meal history id', 400);
  next();
}

const router = Router();

// GET /api/meal-history?region=xxx&sub_region=yyy&page=1&limit=20  (public)
router.get('/', ctrl.listMealHistory);

// POST /api/meal-history/:id/upvote   (protected)
// POST /api/meal-history/:id/downvote (protected)
router.post('/:id/upvote',   auth, validateVote, ctrl.voteOnMealHistory);
router.post('/:id/downvote', auth, validateVote, ctrl.voteOnMealHistory);

module.exports = router;
