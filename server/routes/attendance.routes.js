const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

router.get('/', attendanceController.getAttendanceRecords);
router.get('/report', attendanceController.getAttendanceReport);

router.post('/', authorizeRoles('admin', 'coach'), attendanceController.markAttendance);
router.put('/:id', authorizeRoles('admin', 'coach'), attendanceController.updateAttendance);
router.delete('/:id', authorizeRoles('admin', 'coach'), attendanceController.deleteAttendance);

module.exports = router;
