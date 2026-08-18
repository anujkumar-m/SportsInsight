const fitnessService = require('../services/fitness.service');
const athleteService = require('../services/athlete.service');

function applyRoleFilters(req, queryParams = {}) {
  const params = { ...queryParams };
  const role = req.user?.role?.toLowerCase();
  if (role === 'coach') {
    delete params.coach_id;
    delete params.coachId;
    params.coach_id = req.user.coach_id ?? -1;
  } else if (role === 'athlete') {
    delete params.athlete_id;
    delete params.athleteId;
    params.athleteId = req.user.athlete_id ?? -1;
  }
  return params;
}

async function getFitnessAssessments(req, res, next) {
  try {
    const queryParams = applyRoleFilters(req, req.query);
    const data = await fitnessService.getFitnessAssessments(queryParams);
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
    if (req.user?.role?.toLowerCase() === 'coach' && record.coach_id !== req.user.coach_id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view fitness assessments for your assigned athletes.' });
    }
    if (req.user?.role?.toLowerCase() === 'athlete' && record.athlete_id !== req.user.athlete_id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own fitness assessments.' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

async function createFitness(req, res, next) {
  try {
    if (req.user?.role?.toLowerCase() === 'coach' && req.body.athlete_id) {
      const athlete = await athleteService.getAthleteById(req.body.athlete_id);
      if (!athlete || athlete.coach_id !== req.user.coach_id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only add fitness assessments for your assigned athletes.' });
      }
    }
    const record = await fitnessService.createFitnessAssessment(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Fitness assessment added successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updateFitness(req, res, next) {
  try {
    if (req.user?.role?.toLowerCase() === 'coach') {
      const existing = await fitnessService.getFitnessById(req.params.id);
      if (!existing || existing.coach_id !== req.user.coach_id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only edit fitness assessments for your assigned athletes.' });
      }
    }
    const record = await fitnessService.updateFitnessAssessment(req.params.id, req.body, req.user?.id);
    res.json({ success: true, message: 'Fitness assessment updated successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deleteFitness(req, res, next) {
  try {
    if (req.user?.role?.toLowerCase() === 'coach') {
      const existing = await fitnessService.getFitnessById(req.params.id);
      if (!existing || existing.coach_id !== req.user.coach_id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only delete fitness assessments for your assigned athletes.' });
      }
    }
    const result = await fitnessService.deleteFitnessAssessment(req.params.id, req.user?.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getAthleteFitnessHistory(req, res, next) {
  try {
    if (req.user?.role?.toLowerCase() === 'athlete' && Number(req.params.athleteId) !== req.user.athlete_id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own fitness history.' });
    }
    const data = await fitnessService.getAthleteFitnessHistory(req.params.athleteId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getFitnessAnalytics(req, res, next) {
  try {
    const queryParams = applyRoleFilters(req, req.query);
    const data = await fitnessService.getFitnessAnalytics(queryParams);
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

