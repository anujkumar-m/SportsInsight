// ─── services/coachService.js ─────────────────────────────
import api from './api';

export const coachService = {
  list: (params = {}) => api.get('/coaches', { params }),
  getById: (id) => api.get(`/coaches/${id}`),
  create: (data) => api.post('/coaches', data),
  update: (id, data) => api.put(`/coaches/${id}`, data),
  remove: (id) => api.delete(`/coaches/${id}`),
  getAthletes: (id) => api.get(`/coaches/${id}/athletes`),
  getAnalytics: (id) => api.get(`/coaches/${id}/analytics`),
  assignAthlete: (coach_id, athlete_id) => api.post('/coaches/assign-athlete', { coach_id, athlete_id }),
  removeAthlete: (coach_id, athlete_id) => api.delete('/coaches/remove-athlete', { data: { coach_id, athlete_id } }),
  generateList: (payload) => api.post('/coaches/generate-list', payload),
  getRemarks: (params = {}) => api.get('/coaches/remarks', { params }),
  createRemark: (data) => api.post('/coaches/remarks', data),
  deleteRemark: (id) => api.delete(`/coaches/remarks/${id}`),
};

export default coachService;

