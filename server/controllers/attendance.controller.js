const attendanceService = require('../services/attendance.service');

async function getAttendanceRecords(req, res, next) {
  try {
    const data = await attendanceService.getAttendanceRecords(req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function markAttendance(req, res, next) {
  try {
    const result = await attendanceService.markAttendance(req.body, req.user?.id);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updateAttendance(req, res, next) {
  try {
    const record = await attendanceService.updateAttendance(req.params.id, req.body, req.user?.id);
    res.json({ success: true, message: 'Attendance record updated successfully.', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deleteAttendance(req, res, next) {
  try {
    const result = await attendanceService.deleteAttendance(req.params.id, req.user?.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getAttendanceReport(req, res, next) {
  try {
    const data = await attendanceService.getAttendanceReport(req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAttendanceRecords,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport
};
