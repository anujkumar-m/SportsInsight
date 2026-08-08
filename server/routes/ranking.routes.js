const express = require('express');
const router = express.Router();
const c = require('../controllers/ranking.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

router.get('/',                           c.getRankings);
router.get('/history/:athleteId',         c.getAthleteRankingHistory);
router.get('/comparison',                 c.getRankingComparison);
router.post('/calculate', authorizeRoles('admin'), c.calculateRankings);

module.exports = router;
