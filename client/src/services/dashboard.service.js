import api from './api';

const dashboardAPI = {
  getAdminDashboard: () =>
    api.get('/dashboard/admin').then((r) => r.data),

  getCoachDashboard: () =>
    api.get('/dashboard/coach').then((r) => r.data),

  getSelectorDashboard: () =>
    api.get('/dashboard/selector').then((r) => r.data),

  getAthleteDashboard: () =>
    api.get('/dashboard/athlete').then((r) => r.data),

  generateAIList: (payload) =>
    api.post('/dashboard/ai/generate', payload).then((r) => r.data),

  getListTypes: () =>
    api.get('/dashboard/ai/list-types').then((r) => r.data),

  getAIListHistory: () =>
    api.get('/dashboard/ai/history').then((r) => r.data),

  getNotifications: () =>
    api.get('/dashboard/notifications').then((r) => r.data),

  markNotificationRead: (id) =>
    api.patch(`/dashboard/notifications/${id}/read`),
};

export default dashboardAPI;
