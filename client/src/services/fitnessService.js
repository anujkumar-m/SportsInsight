import api from './api';

export const fitnessService = {
  getAssessments: (params) => api.get('/fitness', { params }),
  getById: (id) => api.get(`/fitness/${id}`),
  create: (data) => api.post('/fitness', data),
  update: (id, data) => api.put(`/fitness/${id}`, data),
  delete: (id) => api.delete(`/fitness/${id}`),
  getHistory: (athleteId) => api.get(`/fitness/history/${athleteId}`),
  getAnalytics: (params) => api.get('/fitness/analytics', { params }),
};

export default fitnessService;
