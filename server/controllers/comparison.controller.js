const comparisonService = require('../services/comparison.service');
const selectorService = require('../services/selector.service');
const { pool } = require('../config/database');

async function compareAthletes(req, res, next) {
  try {
    const rawIds = req.body.athleteIds || req.query.ids?.split(',').map(Number) || [];
    const ids = rawIds.map(Number).filter((n) => n > 0 && !isNaN(n));
    console.log('[Comparison] Received athlete IDs:', ids);

    if (!ids || ids.length < 2) {
      return res.status(400).json({ success: false, message: `At least 2 athlete IDs required. Received: ${JSON.stringify(rawIds)}` });
    }

    if (req.user?.role?.toLowerCase() === 'selector' || req.user?.role?.toLowerCase() === 'state_selector') {
      const sportIds = await selectorService.getSelectorSportIds(req.user.selector_id);
      if (sportIds && sportIds.length > 0) {
        const [athRows] = await pool.query(
          `SELECT id, sport_id FROM athletes WHERE id IN (${ids.map(() => '?').join(',')})`,
          ids
        );
        const unauthorized = athRows.some(a => !sportIds.includes(Number(a.sport_id)));
        if (unauthorized) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only compare athletes belonging to your assigned sport expertise.'
          });
        }
      }
    }

    const data = await comparisonService.compareAthletes(ids);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[Comparison] Error:', e.message);
    res.status(400).json({ success: false, message: e.message });
  }
}

module.exports = { compareAthletes };
