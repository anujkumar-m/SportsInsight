const comparisonService = require('../services/comparison.service');

async function compareAthletes(req, res, next) {
  try {
    const rawIds = req.body.athleteIds || req.query.ids?.split(',').map(Number) || [];
    const ids = rawIds.map(Number).filter((n) => n > 0 && !isNaN(n));
    console.log('[Comparison] Received athlete IDs:', ids);

    if (!ids || ids.length < 2) {
      return res.status(400).json({ success: false, message: `At least 2 athlete IDs required. Received: ${JSON.stringify(rawIds)}` });
    }

    const data = await comparisonService.compareAthletes(ids);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[Comparison] Error:', e.message);
    res.status(400).json({ success: false, message: e.message });
  }
}

module.exports = { compareAthletes };
