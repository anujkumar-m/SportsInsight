const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performance.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

router.get('/', performanceController.getPerformanceRecords);
router.get('/analytics', performanceController.getPerformanceAnalytics);
router.get('/metrics', performanceController.getSportMetrics);
router.post('/metrics', authorizeRoles('admin'), performanceController.createCustomMetric);
router.get('/history/:athleteId', performanceController.getAthletePerformanceHistory);
router.get('/export', performanceController.exportPerformanceData);
router.post('/import', authorizeRoles('admin', 'coach'), performanceController.importPerformanceData);

router.get('/:id', performanceController.getPerformanceById);
router.post('/', authorizeRoles('admin', 'coach'), performanceController.createPerformance);
router.put('/:id', authorizeRoles('admin', 'coach'), performanceController.updatePerformance);
router.delete('/:id', authorizeRoles('admin', 'coach'), performanceController.deletePerformance);

module.exports = router;
