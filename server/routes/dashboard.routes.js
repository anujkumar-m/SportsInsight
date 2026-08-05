const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getCoachDashboard,
  getSelectorDashboard,
  getAthleteDashboard,
  generateAIList,
  getListTypes,
  getNotifications,
  markNotificationRead,
  getAIListHistory,
} = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard routes (role-specific)
router.get('/admin', requireRole('admin'), getAdminDashboard);
router.get('/coach', requireRole('coach'), getCoachDashboard);
router.get('/selector', requireRole('selector'), getSelectorDashboard);
router.get('/athlete', requireRole('athlete'), getAthleteDashboard);

// AI Generate List (admin and coach only)
router.post('/ai/generate', requireRole('admin', 'coach', 'selector'), generateAIList);
router.get('/ai/list-types', requireRole('admin', 'coach', 'selector'), getListTypes);
router.get('/ai/history', requireRole('admin'), getAIListHistory);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

module.exports = router;
