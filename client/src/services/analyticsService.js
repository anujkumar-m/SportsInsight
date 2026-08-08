import api from './api';

export const analyticsService = {
  getDashboard:   ()       => api.get('/analytics/dashboard'),
  getPerformance: (params) => api.get('/analytics/performance', { params }),
  getFitness:     (params) => api.get('/analytics/fitness', { params }),
  getAttendance:  (params) => api.get('/analytics/attendance', { params }),
  getInjury:      (params) => api.get('/analytics/injury', { params }),
  getRanking:     (params) => api.get('/analytics/ranking', { params }),
  getSelection:   (params) => api.get('/analytics/selection', { params }),
  getSports:      (params) => api.get('/analytics/sports', { params }),
  getCoach:       (params) => api.get('/analytics/coach', { params }),
  getAthlete:     (id)     => api.get(`/analytics/athlete/${id}`),
};
