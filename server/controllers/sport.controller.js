const sportService = require('../services/sport.service');
const selectorService = require('../services/selector.service');
const { parsePagination } = require('../utils/helpers');

// ─── Sports ─────────────────────────────────────────────────
exports.listSports = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const queryParams = { ...req.query, page, limit };

    if (req.user?.role?.toLowerCase() === 'selector' || req.user?.role?.toLowerCase() === 'state_selector') {
      const sportIds = await selectorService.getSelectorSportIds(req.user.selector_id);
      if (sportIds && sportIds.length > 0) {
        queryParams.sport_ids = sportIds;
      }
    }

    res.json({ success: true, ...(await sportService.listSports(queryParams)) });
  } catch (err) { next(err); }
};

exports.getSport = async (req, res, next) => {
  try {
    const sport = await sportService.getSportById(req.params.id);
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
    res.json({ success: true, data: sport });
  } catch (err) { next(err); }
};

exports.createSport = async (req, res, next) => {
  try {
    const id = await sportService.createSport(req.body);
    res.status(201).json({ success: true, message: 'Sport created', data: { id } });
  } catch (err) { next(err); }
};

exports.updateSport = async (req, res, next) => {
  try {
    await sportService.updateSport(req.params.id, req.body);
    res.json({ success: true, message: 'Sport updated' });
  } catch (err) { next(err); }
};

exports.deleteSport = async (req, res, next) => {
  try {
    await sportService.deleteSport(req.params.id);
    res.json({ success: true, message: 'Sport deleted' });
  } catch (err) { next(err); }
};

// ─── Metrics ─────────────────────────────────────────────────
exports.getMetrics = async (req, res, next) => {
  try {
    const data = await sportService.getMetrics(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.upsertMetrics = async (req, res, next) => {
  try {
    await sportService.upsertMetrics(req.params.id, req.body.metrics);
    res.json({ success: true, message: 'Metrics saved' });
  } catch (err) { next(err); }
};

exports.deleteMetric = async (req, res, next) => {
  try {
    await sportService.deleteMetric(req.params.metricId);
    res.json({ success: true, message: 'Metric deleted' });
  } catch (err) { next(err); }
};

// ─── Categories ──────────────────────────────────────────────
exports.listCategories = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    res.json({ success: true, ...(await sportService.listCategories({ ...req.query, page, limit })) });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const id = await sportService.createCategory(req.body);
    res.status(201).json({ success: true, message: 'Category created', data: { id } });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    await sportService.updateCategory(req.params.id, req.body);
    res.json({ success: true, message: 'Category updated' });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await sportService.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};

// ─── Age Groups ──────────────────────────────────────────────
exports.listAgeGroups = async (req, res, next) => {
  try { res.json({ success: true, data: await sportService.listAgeGroups() }); }
  catch (err) { next(err); }
};

exports.createAgeGroup = async (req, res, next) => {
  try {
    const id = await sportService.createAgeGroup(req.body);
    res.status(201).json({ success: true, data: { id } });
  } catch (err) { next(err); }
};

exports.updateAgeGroup = async (req, res, next) => {
  try { await sportService.updateAgeGroup(req.params.id, req.body); res.json({ success: true }); }
  catch (err) { next(err); }
};

exports.deleteAgeGroup = async (req, res, next) => {
  try { await sportService.deleteAgeGroup(req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
};

// ─── Gender Categories ────────────────────────────────────────
exports.listGenderCategories = async (req, res, next) => {
  try { res.json({ success: true, data: await sportService.listGenderCategories() }); }
  catch (err) { next(err); }
};

exports.createGenderCategory = async (req, res, next) => {
  try {
    const id = await sportService.createGenderCategory(req.body);
    res.status(201).json({ success: true, data: { id } });
  } catch (err) { next(err); }
};

exports.updateGenderCategory = async (req, res, next) => {
  try { await sportService.updateGenderCategory(req.params.id, req.body); res.json({ success: true }); }
  catch (err) { next(err); }
};

exports.deleteGenderCategory = async (req, res, next) => {
  try { await sportService.deleteGenderCategory(req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
};

// ─── Events ──────────────────────────────────────────────────
exports.listEvents = async (req, res, next) => {
  try { res.json({ success: true, data: await sportService.listEvents(req.query) }); }
  catch (err) { next(err); }
};

exports.createEvent = async (req, res, next) => {
  try {
    const id = await sportService.createEvent(req.body);
    res.status(201).json({ success: true, data: { id } });
  } catch (err) { next(err); }
};

exports.updateEvent = async (req, res, next) => {
  try { await sportService.updateEvent(req.params.id, req.body); res.json({ success: true }); }
  catch (err) { next(err); }
};

exports.deleteEvent = async (req, res, next) => {
  try { await sportService.deleteEvent(req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
};
