const service = require('./meal-history.service');

async function listMealHistory(req, res, next) {
  try {
    const { region, sub_region } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const result = await service.getMealHistory({ region, subRegion: sub_region, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function voteOnMealHistory(req, res, next) {
  try {
    const { id } = req.params;
    const direction = req.route.path.includes('upvote') ? 'upvote' : 'downvote';
    const result = await service.vote(id, direction);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listMealHistory, voteOnMealHistory };
