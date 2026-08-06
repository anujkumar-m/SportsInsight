// ─── services/sportService.js ─────────────────────────────
import api from './api';

export const sportService = {
  // Sports
  listSports: (params = {}) => api.get('/sports', { params }),
  getSport: (id) => api.get(`/sports/${id}`),
  createSport: (data) => api.post('/sports', data),
  updateSport: (id, data) => api.put(`/sports/${id}`, data),
  deleteSport: (id) => api.delete(`/sports/${id}`),

  // Metrics
  getMetrics: (sportId) => api.get(`/sports/${sportId}/metrics`),
  upsertMetrics: (sportId, metrics) => api.post(`/sports/${sportId}/metrics`, { metrics }),
  deleteMetric: (sportId, metricId) => api.delete(`/sports/${sportId}/metrics/${metricId}`),

  // Categories
  listCategories: (params = {}) => api.get('/categories', { params }),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),

  // Age Groups
  listAgeGroups: () => api.get('/sports/age-groups/list'),
  createAgeGroup: (data) => api.post('/sports/age-groups/create', data),
  updateAgeGroup: (id, data) => api.put(`/sports/age-groups/${id}`, data),
  deleteAgeGroup: (id) => api.delete(`/sports/age-groups/${id}`),

  // Gender Categories
  listGenderCategories: () => api.get('/sports/gender-categories/list'),
};

export default sportService;
