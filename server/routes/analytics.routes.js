const express = require('express');
const router = express.Router();
const c = require('../controllers/analytics.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

router.get('/dashboard',        c.getDashboard);
router.get('/performance',      c.getPerformance);
router.get('/fitness',          c.getFitness);
router.get('/attendance',       c.getAttendance);
router.get('/injury',           c.getInjury);
router.get('/ranking',          c.getRanking);
router.get('/selection',        c.getSelection);
router.get('/sports',           c.getSports);
router.get('/coach',            c.getCoach);
router.get('/athlete/:athleteId', c.getAthlete);

module.exports = router;
