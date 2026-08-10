// ─── controllers/athlete.controller.js ────────────────────
'use strict';

const athleteService = require('../services/athlete.service');
const { parsePagination } = require('../utils/helpers');

// GET /api/athletes
exports.list = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const queryParams = { ...req.query, page, limit };
    if (req.user.role === 'coach') {
      queryParams.coach_id = req.user.coach_id || 0;
    }
    const result = await athleteService.listAthletes(queryParams);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// GET /api/athletes/archived
exports.listArchived = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const queryParams = { ...req.query, page, limit, current_status: 'archived' };
    if (req.user.role === 'coach') {
      queryParams.coach_id = req.user.coach_id || 0;
    }
    const result = await athleteService.listAthletes(queryParams);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// GET /api/athletes/:id
exports.getOne = async (req, res, next) => {
  try {
    const athlete = await athleteService.getAthleteById(req.params.id);
    if (!athlete) return res.status(404).json({ success: false, message: 'Athlete not found' });
    res.json({ success: true, data: athlete });
  } catch (err) { next(err); }
};

// POST /api/athletes
exports.create = async (req, res, next) => {
  try {
    const result = await athleteService.createAthlete(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Athlete created successfully', data: result });
  } catch (err) { next(err); }
};

// PUT /api/athletes/:id
exports.update = async (req, res, next) => {
  try {
    if (req.user.role === 'athlete') {
      const athlete = await athleteService.getAthleteById(req.params.id);
      if (!athlete || athlete.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only edit your own profile.' });
      }
    }
    await athleteService.updateAthlete(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Athlete updated successfully' });
  } catch (err) { next(err); }
};

// DELETE /api/athletes/:id
exports.remove = async (req, res, next) => {
  try {
    await athleteService.deleteAthlete(req.params.id);
    res.json({ success: true, message: 'Athlete deleted' });
  } catch (err) { next(err); }
};

// POST /api/athletes/archive
exports.archive = async (req, res, next) => {
  try {
    const { id } = req.body;
    await athleteService.archiveAthlete(id, req.user.id);
    res.json({ success: true, message: 'Athlete archived' });
  } catch (err) { next(err); }
};

// POST /api/athletes/restore
exports.restore = async (req, res, next) => {
  try {
    const { id } = req.body;
    await athleteService.restoreAthlete(id, req.user.id);
    res.json({ success: true, message: 'Athlete restored' });
  } catch (err) { next(err); }
};

// POST /api/athletes/bulk-delete
exports.bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'ids required' });
    await athleteService.bulkDelete(ids);
    res.json({ success: true, message: `${ids.length} athletes deleted` });
  } catch (err) { next(err); }
};

// POST /api/athletes/bulk-update
exports.bulkUpdate = async (req, res, next) => {
  try {
    const { ids, data } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'ids required' });
    await athleteService.bulkUpdate(ids, data, req.user.id);
    res.json({ success: true, message: `${ids.length} athletes updated` });
  } catch (err) { next(err); }
};

// GET /api/athletes/export
exports.exportData = async (req, res, next) => {
  try {
    const queryParams = { ...req.query };
    if (req.user.role === 'coach') {
      queryParams.coach_id = req.user.coach_id || 0;
    }
    const data = await athleteService.exportAthletes(queryParams);
    res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
};

// POST /api/athletes/import
exports.importData = async (req, res, next) => {
  try {
    const rows = req.body.athletes;
    if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ success: false, message: 'No athletes in payload' });
    const results = { created: 0, failed: 0, errors: [] };
    for (const row of rows) {
      try {
        await athleteService.createAthlete(row, req.user.id);
        results.created++;
      } catch (e) {
        results.failed++;
        results.errors.push({ row: row.email, error: e.message });
      }
    }
    res.json({ success: true, message: `Import complete: ${results.created} created, ${results.failed} failed`, data: results });
  } catch (err) { next(err); }
};

// POST /api/athletes/generate-list
exports.generateList = async (req, res, next) => {
  try {
    const { list_type, sport_id, category_id, limit } = req.body;
    const coach_id = req.user.role === 'coach' ? req.user.coach_id : req.body.coach_id;
    const result = await athleteService.generateAiList({ list_type, sport_id, category_id, coach_id, limit });
    res.json({ success: true, list_type, count: result.length, data: result });
  } catch (err) { next(err); }
};
