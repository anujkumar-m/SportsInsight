import api from './api';

export const attendanceService = {
  getRecords: (params) => api.get('/attendance', { params }),
  markAttendance: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  getReport: (params) => api.get('/attendance/report', { params }),
};

export default attendanceService;
