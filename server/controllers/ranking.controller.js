const rankingService = require('../services/ranking.service');
const selectorService = require('../services/selector.service');
const { pool } = require('../config/database');

async function getRankings(req, res, next) {
  try {
    const queryParams = { ...req.query };
    if (req.user?.role?.toLowerCase() === 'athlete') {
      const athleteId = req.user.athlete_id;
      if (athleteId) {
        const [athRows] = await pool.query('SELECT sport_id FROM athletes WHERE id = ?', [athleteId]);
        if (athRows.length > 0 && athRows[0].sport_id) {
          queryParams.sportId = athRows[0].sport_id;
        } else {
          queryParams.sportId = -1;
        }
      } else {
        queryParams.sportId = -1;
      }
    } else if (req.user?.role?.toLowerCase() === 'selector' || req.user?.role?.toLowerCase() === 'state_selector') {
      const sportIds = await selectorService.getSelectorSportIds(req.user.selector_id);
      if (sportIds && sportIds.length > 0) {
        if (queryParams.sportId) {
          if (!sportIds.includes(Number(queryParams.sportId))) {
            queryParams.sportId = -999;
          }
        } else {
          queryParams.sportIds = sportIds;
        }
      }
    }
    res.json({ success: true, data: await rankingService.getRankings(queryParams) });
  } catch (e) {
    next(e);
  }
}

async function calculateRankings(req, res, next) {
  try {
    const result = await rankingService.calculateRankings();
    res.json({ success: true, message: `Rankings calculated for ${result.calculated} athletes.`, data: result });
  } catch (e) { next(e); }
}

async function getAthleteRankingHistory(req, res, next) {
  try {
    if (req.user?.role?.toLowerCase() === 'athlete' && Number(req.params.athleteId) !== req.user.athlete_id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own ranking history.' });
    }
    res.json({ success: true, data: await rankingService.getAthleteRankingHistory(req.params.athleteId) });
  } catch (e) { next(e); }
}

async function getRankingComparison(req, res, next) {
  try {
    const ids = (req.query.ids || '').split(',').map(Number).filter(Boolean);
    res.json({ success: true, data: await rankingService.getRankingComparison(ids) });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
}

module.exports = { getRankings, calculateRankings, getAthleteRankingHistory, getRankingComparison };
