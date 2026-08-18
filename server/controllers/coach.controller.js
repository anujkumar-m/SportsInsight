// ─── controllers/coach.controller.js ─────────────────────
'use strict';

const coachService = require('../services/coach.service');
const { parsePagination } = require('../utils/helpers');

exports.list = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    res.json({ success: true, ...(await coachService.listCoaches({ ...req.query, page, limit })) });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const coach = await coachService.getCoachById(req.params.id);
    if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
    res.json({ success: true, data: coach });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const result = await coachService.createCoach(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Coach created', data: result });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    await coachService.updateCoach(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Coach updated' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await coachService.deleteCoach(req.params.id);
    res.json({ success: true, message: 'Coach deleted' });
  } catch (err) { next(err); }
};

exports.getAthletes = async (req, res, next) => {
  try {
    const coach = await coachService.getCoachById(req.params.id);
    if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
    res.json({ success: true, data: coach.athletes });
  } catch (err) { next(err); }
};

exports.assignAthlete = async (req, res, next) => {
  try {
    const { coach_id, athlete_id } = req.body;
    await coachService.assignAthlete(coach_id, athlete_id, req.user.id);
    res.json({ success: true, message: 'Athlete assigned to coach' });
  } catch (err) { next(err); }
};

exports.removeAthlete = async (req, res, next) => {
  try {
    const { coach_id, athlete_id } = req.body;
    await coachService.removeAthlete(coach_id, athlete_id);
    res.json({ success: true, message: 'Athlete removed from coach' });
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const data = await coachService.getAnalytics(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.generateList = async (req, res, next) => {
  try {
    const coach_id = req.user.role === 'coach' ? req.user.coach_id : req.body.coach_id;
    const { list_type, limit } = req.body;
    const result = await coachService.generateCoachAiList(coach_id, list_type, limit);
    res.json({ success: true, list_type, count: result.length, data: result });
  } catch (err) { next(err); }
};

exports.getRemarks = async (req, res, next) => {
  try {
    let { athlete_id, coach_id, limit, remark_type } = req.query;
    if (req.user.role === 'athlete') {
      athlete_id = req.user.athlete_id || 0;
    }
    const remarks = await coachService.getCoachRemarks({ athlete_id, coach_id, limit, remark_type });
    res.json({ success: true, data: remarks });
  } catch (err) { next(err); }
};

exports.createRemark = async (req, res, next) => {
  try {
    const { athlete_id, coach_id, remark_type, rating, remarks, remark_date } = req.body;
    if (!athlete_id || !remarks) {
      return res.status(400).json({ success: false, message: 'athlete_id and remarks are required' });
    }
    let resolvedCoachId = req.user?.coach_id || coach_id;
    if (!resolvedCoachId) {
      const [coachRows] = await pool.query('SELECT id FROM coaches WHERE user_id = ? LIMIT 1', [req.user?.id || 0]);
      if (coachRows && coachRows.length > 0) {
        resolvedCoachId = coachRows[0].id;
      } else {
        const [anyCoach] = await pool.query('SELECT id FROM coaches LIMIT 1');
        resolvedCoachId = anyCoach?.[0]?.id || 1;
      }
    }
    const result = await coachService.createCoachRemark({
      athlete_id,
      coach_id: resolvedCoachId,
      remark_type: remark_type || 'general',
      rating: rating || 8.0,
      remarks,
      remark_date,
    });
    res.status(201).json({ success: true, message: 'Remark submitted successfully', data: result });
  } catch (err) { next(err); }
};

exports.deleteRemark = async (req, res, next) => {
  try {
    await coachService.deleteCoachRemark(req.params.id);
    res.json({ success: true, message: 'Remark deleted' });
  } catch (err) { next(err); }
};

