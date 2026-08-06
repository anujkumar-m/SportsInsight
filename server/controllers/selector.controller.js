// ─── controllers/selector.controller.js ──────────────────
'use strict';

const selectorService = require('../services/selector.service');
const { parsePagination } = require('../utils/helpers');

exports.list = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    res.json({ success: true, ...(await selectorService.listSelectors({ ...req.query, page, limit })) });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const sel = await selectorService.getSelectorById(req.params.id);
    if (!sel) return res.status(404).json({ success: false, message: 'Selector not found' });
    res.json({ success: true, data: sel });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const result = await selectorService.createSelector(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Selector created', data: result });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    await selectorService.updateSelector(req.params.id, req.body);
    res.json({ success: true, message: 'Selector updated' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await selectorService.deleteSelector(req.params.id);
    res.json({ success: true, message: 'Selector deleted' });
  } catch (err) { next(err); }
};

exports.assignSport = async (req, res, next) => {
  try {
    const { selector_id, sport_id } = req.body;
    await selectorService.assignSport(selector_id, sport_id);
    res.json({ success: true, message: 'Sport assigned to selector' });
  } catch (err) { next(err); }
};

exports.removeSport = async (req, res, next) => {
  try {
    const { selector_id, sport_id } = req.body;
    await selectorService.removeSport(selector_id, sport_id);
    res.json({ success: true, message: 'Sport removed from selector' });
  } catch (err) { next(err); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const data = await selectorService.getSelectionHistory(req.params.id, page, limit);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const data = await selectorService.getRecommendationDashboard(req.params.id || req.user.selector_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
