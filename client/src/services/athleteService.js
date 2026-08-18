// ─── services/athleteService.js ──────────────────────────
import api from './api';

export const athleteService = {
  list: (params = {}) => api.get('/athletes', { params }),
  getAthletes: (params = {}) => api.get('/athletes', { params }),
  listArchived: (params = {}) => api.get('/athletes/archived', { params }),
  getById: (id) => api.get(`/athletes/${id}`),
  getAthleteById: (id) => api.get(`/athletes/${id}`),
  create: (data) => api.post('/athletes', data),
  update: (id, data) => api.put(`/athletes/${id}`, data),
  remove: (id) => api.delete(`/athletes/${id}`),
  archive: (id) => api.post('/athletes/archive', { id }),
  restore: (id) => api.post('/athletes/restore', { id }),
  bulkDelete: (ids) => api.post('/athletes/bulk-delete', { ids }),
  bulkUpdate: (ids, data) => api.post('/athletes/bulk-update', { ids, data }),
  exportData: (params = {}) => api.get('/athletes/export', { params }),
  importData: (athletes) => api.post('/athletes/import', { athletes }),
  generateList: (payload) => api.post('/athletes/generate-list', payload),
  addAchievement: (data) => api.post('/athletes/achievements', data),
  listAchievements: (params = {}) => api.get('/athletes/achievements', { params }),
  getAthleteAchievements: (athleteId) => api.get(`/athletes/${athleteId}/achievements`),
  deleteAchievement: (id) => api.delete(`/athletes/achievements/${id}`),
};

export default athleteService;
