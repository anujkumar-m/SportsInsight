import api from './api';

export const selectionService = {
  getSelections:      (params) => api.get('/selections', { params }),
  getRecommendations: (params) => api.get('/selections/recommendations', { params }),
  getHistory:         (params) => api.get('/selections/history', { params }),
  generate:           (body)   => api.post('/selections/generate', body),
};

export default selectionService;

