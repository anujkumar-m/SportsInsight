const performanceService = require('../services/performance.service');
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

async function getPerformanceRecords(req, res, next) {
  try {
    const queryParams = applyRoleFilters(req, req.query);
    const data = await performanceService.getPerformanceRecords(queryParams);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getPerformanceById(req, res, next) {
  try {
    const record = await performanceService.getPerformanceById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Performance record not found.' });
    }
    if (req.user?.role?.toLowerCase() === 'coach' && record.coach_id !== req.user.coach_id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view performance records for your assigned athletes.' });
    }
    if (req.user?.role?.toLowerCase() === 'athlete' && record.athlete_id !== req.user.athlete_id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own performance records.' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

async function createPerformance(req, res, next) {
  try {
    if (req.user?.role?.toLowerCase() === 'coach' && req.body.athlete_id) {
      const athlete = await athleteService.getAthleteById(req.body.athlete_id);
      if (!athlete || athlete.coach_id !== req.user.coach_id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only add performance records for your assigned athletes.' });
      }
    }
    const record = await performanceService.createPerformanceRecord(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Performance record added successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updatePerformance(req, res, next) {
  try {
    if (req.user?.role?.toLowerCase() === 'coach') {
      const existing = await performanceService.getPerformanceById(req.params.id);
      if (!existing || existing.coach_id !== req.user.coach_id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only edit performance records for your assigned athletes.' });
      }
    }
    const record = await performanceService.updatePerformanceRecord(req.params.id, req.body, req.user?.id);
    res.json({ success: true, message: 'Performance record updated successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deletePerformance(req, res, next) {
  try {
    if (req.user?.role?.toLowerCase() === 'coach') {
      const existing = await performanceService.getPerformanceById(req.params.id);
      if (!existing || existing.coach_id !== req.user.coach_id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only delete performance records for your assigned athletes.' });
      }
    }
    const result = await performanceService.deletePerformanceRecord(req.params.id, req.user?.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getAthletePerformanceHistory(req, res, next) {
  try {
    if (req.user?.role?.toLowerCase() === 'athlete' && Number(req.params.athleteId) !== req.user.athlete_id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own performance history.' });
    }
    const data = await performanceService.getAthletePerformanceHistory(req.params.athleteId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getPerformanceAnalytics(req, res, next) {
  try {
    const queryParams = applyRoleFilters(req, req.query);
    const data = await performanceService.getPerformanceAnalytics(queryParams);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getSportMetrics(req, res, next) {
  try {
    const data = await performanceService.getSportMetrics(req.query.sportId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createCustomMetric(req, res, next) {
  try {
    const data = await performanceService.createCustomMetric(req.body);
    res.status(201).json({ success: true, message: 'Custom sport metric created successfully.', data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function importPerformanceData(req, res, next) {
  try {
    const result = await performanceService.importPerformanceData(req.body.records || req.body, req.user?.id);
    res.json({ success: true, message: `Successfully imported ${result.importedCount} performance records.`, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function exportPerformanceData(req, res, next) {
  try {
    const queryParams = applyRoleFilters(req, req.query);
    const data = await performanceService.exportPerformanceData(queryParams);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPerformanceRecords,
  getPerformanceById,
  createPerformance,
  updatePerformance,
  deletePerformance,
  getAthletePerformanceHistory,
  getPerformanceAnalytics,
  getSportMetrics,
  createCustomMetric,
  importPerformanceData,
  exportPerformanceData
};

