const performanceService = require('../services/performance.service');

async function getPerformanceRecords(req, res, next) {
  try {
    const data = await performanceService.getPerformanceRecords(req.query);
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
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

async function createPerformance(req, res, next) {
  try {
    const record = await performanceService.createPerformanceRecord(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Performance record added successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updatePerformance(req, res, next) {
  try {
    const record = await performanceService.updatePerformanceRecord(req.params.id, req.body, req.user?.id);
    res.json({ success: true, message: 'Performance record updated successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deletePerformance(req, res, next) {
  try {
    const result = await performanceService.deletePerformanceRecord(req.params.id, req.user?.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getAthletePerformanceHistory(req, res, next) {
  try {
    const data = await performanceService.getAthletePerformanceHistory(req.params.athleteId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getPerformanceAnalytics(req, res, next) {
  try {
    const data = await performanceService.getPerformanceAnalytics(req.query);
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
    const data = await performanceService.exportPerformanceData(req.query);
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
