import api from './api';

export const injuryService = {
  getInjuries: (params) => api.get('/injuries', { params }),
  getById: (id) => api.get(`/injuries/${id}`),
  create: (data) => api.post('/injuries', data),
  update: (id, data) => api.put(`/injuries/${id}`, data),
  delete: (id) => api.delete(`/injuries/${id}`),
  addRecoveryLog: (id, data) => api.post(`/injuries/${id}/recovery`, data),
  getHistory: (athleteId) => api.get(`/injuries/history/${athleteId}`),
};

export default injuryService;
