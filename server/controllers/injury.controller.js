const injuryService = require('../services/injury.service');

async function getInjuries(req, res, next) {
  try {
    const data = await injuryService.getInjuries(req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getInjuryById(req, res, next) {
  try {
    const record = await injuryService.getInjuryById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Injury record not found.' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

async function createInjury(req, res, next) {
  try {
    const record = await injuryService.createInjury(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Injury record added successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updateInjury(req, res, next) {
  try {
    const record = await injuryService.updateInjury(req.params.id, req.body, req.user?.id);
    res.json({ success: true, message: 'Injury record updated successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deleteInjury(req, res, next) {
  try {
    const result = await injuryService.deleteInjury(req.params.id, req.user?.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function addRecoveryLog(req, res, next) {
  try {
    const record = await injuryService.addRecoveryLog(req.params.id, req.body, req.user?.id);
    res.json({ success: true, message: 'Recovery checkup logged successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getAthleteInjuryHistory(req, res, next) {
  try {
    const data = await injuryService.getAthleteInjuryHistory(req.params.athleteId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInjuries,
  getInjuryById,
  createInjury,
  updateInjury,
  deleteInjury,
  addRecoveryLog,
  getAthleteInjuryHistory
};
