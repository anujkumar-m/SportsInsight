import api from './api';

export const comparisonService = {
  compare: (athleteIds) => api.post('/comparison', { athleteIds }),
};
