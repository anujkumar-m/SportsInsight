const comparisonService = require('../services/comparison.service');

async function compareAthletes(req, res, next) {
  try {
    const ids = (req.body.athleteIds || req.query.ids?.split(',').map(Number) || []).filter(Boolean);
    const data = await comparisonService.compareAthletes(ids);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

module.exports = { compareAthletes };
