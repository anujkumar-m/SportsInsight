import api from './api';

export const rankingService = {
  getRankings:      (params) => api.get('/rankings', { params }),
  getHistory:       (athleteId) => api.get(`/rankings/history/${athleteId}`),
  getComparison:    (ids) => api.get('/rankings/comparison', { params: { ids: ids.join(',') } }),
  calculate:        () => api.post('/rankings/calculate'),
};

export default rankingService;

