const fitnessService = require('../services/fitness.service');

async function getFitnessAssessments(req, res, next) {
  try {
    const data = await fitnessService.getFitnessAssessments(req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getFitnessById(req, res, next) {
  try {
    const record = await fitnessService.getFitnessById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Fitness assessment record not found.' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

async function createFitness(req, res, next) {
  try {
    const record = await fitnessService.createFitnessAssessment(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Fitness assessment added successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updateFitness(req, res, next) {
  try {
    const record = await fitnessService.updateFitnessAssessment(req.params.id, req.body, req.user?.id);
    res.json({ success: true, message: 'Fitness assessment updated successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deleteFitness(req, res, next) {
  try {
    const result = await fitnessService.deleteFitnessAssessment(req.params.id, req.user?.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getAthleteFitnessHistory(req, res, next) {
  try {
    const data = await fitnessService.getAthleteFitnessHistory(req.params.athleteId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getFitnessAnalytics(req, res, next) {
  try {
    const data = await fitnessService.getFitnessAnalytics(req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFitnessAssessments,
  getFitnessById,
  createFitness,
  updateFitness,
  deleteFitness,
  getAthleteFitnessHistory,
  getFitnessAnalytics
};
