// ─── services/selectorService.js ─────────────────────────
import api from './api';

export const selectorService = {
  list: (params = {}) => api.get('/selectors', { params }),
  getById: (id) => api.get(`/selectors/${id}`),
  create: (data) => api.post('/selectors', data),
  update: (id, data) => api.put(`/selectors/${id}`, data),
  remove: (id) => api.delete(`/selectors/${id}`),
  assignSport: (selector_id, sport_id) => api.post('/selectors/assign-sport', { selector_id, sport_id }),
  removeSport: (selector_id, sport_id) => api.delete('/selectors/remove-sport', { data: { selector_id, sport_id } }),
  getHistory: (id, params = {}) => api.get(`/selectors/${id}/history`, { params }),
  getRecommendations: (id) => api.get(`/selectors/${id}/recommendations`),
};

export default selectorService;
