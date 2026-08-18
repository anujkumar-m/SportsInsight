const athleteService = require('../services/athlete.service');
const selectorService = require('../services/selector.service');
const { parsePagination } = require('../utils/helpers');

// GET /api/athletes
exports.list = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const queryParams = { ...req.query, page, limit };
    if (req.user.role?.toLowerCase() === 'coach') {
      delete queryParams.coach_id;
      queryParams.coach_id = req.user.coach_id ?? -1;
    } else if (req.user.role?.toLowerCase() === 'selector' || req.user.role?.toLowerCase() === 'state_selector') {
      const sportIds = await selectorService.getSelectorSportIds(req.user.selector_id);
      if (sportIds && sportIds.length > 0) {
        if (queryParams.sport_id) {
          if (!sportIds.includes(Number(queryParams.sport_id))) {
            queryParams.sport_id = -999;
          }
        } else {
          queryParams.sport_ids = sportIds;
        }
      }
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
    if (req.user.role?.toLowerCase() === 'coach') {
      delete queryParams.coach_id;
      queryParams.coach_id = req.user.coach_id ?? -1;
    } else if (req.user.role?.toLowerCase() === 'selector' || req.user.role?.toLowerCase() === 'state_selector') {
      const sportIds = await selectorService.getSelectorSportIds(req.user.selector_id);
      if (sportIds && sportIds.length > 0) {
        if (queryParams.sport_id) {
          if (!sportIds.includes(Number(queryParams.sport_id))) {
            queryParams.sport_id = -999;
          }
        } else {
          queryParams.sport_ids = sportIds;
        }
      }
    }
    const result = await athleteService.listAthletes(queryParams);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// GET /api/athletes/:id
exports.getOne = async (req, res, next) => {
  try {
    let targetId = req.params.id;
    if (targetId === 'me' || targetId === 'profile' || (!targetId && req.user.role?.toLowerCase() === 'athlete')) {
      const { pool } = require('../config/database');
      const [athRows] = await pool.query('SELECT id FROM athletes WHERE user_id = ?', [req.user.id]);
      if (!athRows.length) {
        return res.status(404).json({ success: false, message: 'Athlete profile not found for this user account.' });
      }
      targetId = athRows[0].id;
    }

    const athlete = await athleteService.getAthleteById(targetId);
    if (!athlete) return res.status(404).json({ success: false, message: 'Athlete not found' });

    if (req.user.role?.toLowerCase() === 'athlete') {
      if (athlete.user_id !== req.user.id && athlete.id !== req.user.athlete_id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view your own profile.' });
      }
    } else if (req.user.role?.toLowerCase() === 'coach' && athlete.coach_id !== req.user.coach_id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your assigned athletes.' });
    } else if (req.user.role?.toLowerCase() === 'selector' || req.user.role?.toLowerCase() === 'state_selector') {
      const sportIds = await selectorService.getSelectorSportIds(req.user.selector_id);
      if (sportIds && sportIds.length > 0 && !sportIds.includes(Number(athlete.sport_id))) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view athletes in your assigned sports.' });
      }
    }
    res.json({ success: true, data: athlete });
  } catch (err) { next(err); }
};

// POST /api/athletes
exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.user.role?.toLowerCase() === 'coach') {
      data.coach_id = req.user.coach_id;
    }
    const result = await athleteService.createAthlete(data, req.user.id);
    res.status(201).json({ success: true, message: 'Athlete created successfully', data: result });
  } catch (err) { next(err); }
};

// PUT /api/athletes/:id
exports.update = async (req, res, next) => {
  try {
    const athlete = await athleteService.getAthleteById(req.params.id);
    if (!athlete) return res.status(404).json({ success: false, message: 'Athlete not found' });

    if (req.user.role?.toLowerCase() === 'athlete' && athlete.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only edit your own profile.' });
    }
    if (req.user.role?.toLowerCase() === 'coach' && athlete.coach_id !== req.user.coach_id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only edit your assigned athletes.' });
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
    if (req.user.role?.toLowerCase() === 'coach') {
      // Always derive coach_id from the authenticated session.
      // Delete any coach_id the client may have sent to prevent tampering.
      delete queryParams.coach_id;
      queryParams.coach_id = req.user.coach_id ?? -1;
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
