const selectionService = require('../services/selection.service');

async function getSelections(req, res, next) {
  try { res.json({ success: true, data: await selectionService.getSelections(req.query) }); }
  catch (e) { next(e); }
}

async function getRecommendations(req, res, next) {
  try { res.json({ success: true, data: await selectionService.generateRecommendations(req.query) }); }
  catch (e) { next(e); }
}

async function generateAndSave(req, res, next) {
  try {
    const { filters = {}, selectionType = 'AI Generated', save = false } = req.body;
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
