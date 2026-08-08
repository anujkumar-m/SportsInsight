import api from './api';

export const performanceService = {
  getRecords: (params) => api.get('/performance', { params }),
  getById: (id) => api.get(`/performance/${id}`),
  create: (data) => api.post('/performance', data),
  update: (id, data) => api.put(`/performance/${id}`, data),
  delete: (id) => api.delete(`/performance/${id}`),
  getHistory: (athleteId) => api.get(`/performance/history/${athleteId}`),
  getAnalytics: (params) => api.get('/performance/analytics', { params }),
  getSportMetrics: (sportId) => api.get('/performance/metrics', { params: { sportId } }),
  createCustomMetric: (data) => api.post('/performance/metrics', data),
  importRecords: (records) => api.post('/performance/import', { records }),
  exportRecords: (params) => api.get('/performance/export', { params }),
};

export default performanceService;
