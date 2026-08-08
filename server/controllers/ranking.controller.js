const rankingService = require('../services/ranking.service');

async function getRankings(req, res, next) {
  try { res.json({ success: true, data: await rankingService.getRankings(req.query) }); }
  catch (e) { next(e); }
}

async function calculateRankings(req, res, next) {
  try {
    const result = await rankingService.calculateRankings();
    res.json({ success: true, message: `Rankings calculated for ${result.calculated} athletes.`, data: result });
  } catch (e) { next(e); }
}

async function getAthleteRankingHistory(req, res, next) {
  try { res.json({ success: true, data: await rankingService.getAthleteRankingHistory(req.params.athleteId) }); }
  catch (e) { next(e); }
}

async function getRankingComparison(req, res, next) {
  try {
    const ids = (req.query.ids || '').split(',').map(Number).filter(Boolean);
    res.json({ success: true, data: await rankingService.getRankingComparison(ids) });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
}

module.exports = { getRankings, calculateRankings, getAthleteRankingHistory, getRankingComparison };
