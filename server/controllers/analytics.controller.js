const analyticsService = require('../services/analytics.service');

const getDashboard    = async (req, res, next) => { try { res.json({ success: true, data: await analyticsService.getDashboardAnalytics() }); } catch (e) { next(e); } };
const getPerformance  = async (req, res, next) => { try { res.json({ success: true, data: await analyticsService.getPerformanceAnalytics(req.query) }); } catch (e) { next(e); } };
const getFitness      = async (req, res, next) => { try { res.json({ success: true, data: await analyticsService.getFitnessAnalytics(req.query) }); } catch (e) { next(e); } };
const getAttendance   = async (req, res, next) => { try { res.json({ success: true, data: await analyticsService.getAttendanceAnalytics(req.query) }); } catch (e) { next(e); } };
const getInjury       = async (req, res, next) => { try { res.json({ success: true, data: await analyticsService.getInjuryAnalytics(req.query) }); } catch (e) { next(e); } };
const getRanking      = async (req, res, next) => { try { res.json({ success: true, data: await analyticsService.getRankingAnalytics(req.query) }); } catch (e) { next(e); } };
const getSelection    = async (req, res, next) => { try { res.json({ success: true, data: await analyticsService.getSelectionAnalytics(req.query) }); } catch (e) { next(e); } };
const getSports       = async (req, res, next) => { try { res.json({ success: true, data: await analyticsService.getSportAnalytics(req.query) }); } catch (e) { next(e); } };
const getCoach        = async (req, res, next) => { try { res.json({ success: true, data: await analyticsService.getCoachAnalytics(req.query) }); } catch (e) { next(e); } };
const getAthlete      = async (req, res, next) => { try { res.json({ success: true, data: await analyticsService.getAthleteAnalytics(req.params.athleteId) }); } catch (e) { next(e); } };

module.exports = { getDashboard, getPerformance, getFitness, getAttendance, getInjury, getRanking, getSelection, getSports, getCoach, getAthlete };
