const selectionService = require('../services/selection.service');
const selectorService = require('../services/selector.service');

async function getSelections(req, res, next) {
  try {
    const queryParams = { ...req.query };
    if (req.user?.role?.toLowerCase() === 'selector' || req.user?.role?.toLowerCase() === 'state_selector') {
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
    res.json({ success: true, data: await selectionService.getSelections(queryParams) });
  } catch (e) { next(e); }
}

async function getRecommendations(req, res, next) {
  try {
    const queryParams = { ...req.query };
    if (req.user?.role?.toLowerCase() === 'selector' || req.user?.role?.toLowerCase() === 'state_selector') {
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
    res.json({ success: true, data: await selectionService.generateRecommendations(queryParams) });
  } catch (e) { next(e); }
}

async function generateAndSave(req, res, next) {
  try {
    const { filters = {}, selectionType = 'AI Generated', save = false } = req.body;
    if (req.user?.role?.toLowerCase() === 'selector' || req.user?.role?.toLowerCase() === 'state_selector') {
      const sportIds = await selectorService.getSelectorSportIds(req.user.selector_id);
      if (sportIds && sportIds.length > 0) {
        if (filters.sportId) {
          if (!sportIds.includes(Number(filters.sportId))) {
            filters.sportId = -999;
          }
        } else {
          filters.sportIds = sportIds;
        }
      }
    }
    const recommendations = await selectionService.generateRecommendations(filters);
    let saved = null;
    if (save) {
      saved = await selectionService.saveSelections(recommendations, req.user?.id, selectionType, filters);
    }
    res.json({ success: true, data: recommendations, saved });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
}

async function getSelectionHistory(req, res, next) {
  try { res.json({ success: true, data: await selectionService.getSelectionHistory(req.query) }); }
  catch (e) { next(e); }
}

module.exports = { getSelections, getRecommendations, generateAndSave, getSelectionHistory };
