import api from './api';

const dashboardAPI = {
  getAdminDashboard: async () => {
    const res = await api.get('/dashboard/admin');
    return res.data || res;
  },

  getCoachDashboard: async () => {
    const res = await api.get('/dashboard/coach');
    return res.data || res;
  },

  getSelectorDashboard: async () => {
    const res = await api.get('/dashboard/selector');
    return res.data || res;
  },

  getAthleteDashboard: async () => {
    const res = await api.get('/dashboard/athlete');
    return res.data || res;
  },

  generateAIList: async (payload) => {
    const res = await api.post('/dashboard/ai/generate', payload);
    return res.data || res;
  },

  getListTypes: async () => {
    const res = await api.get('/dashboard/ai/list-types');
    return res.data || res || { listTypes: [] };
  },

  getAIListHistory: async () => {
    const res = await api.get('/dashboard/ai/history');
    return res.data || res;
  },

  getNotifications: async () => {
    const res = await api.get('/dashboard/notifications');
    return res.data || res;
  },

  markNotificationRead: async (id) => {
    return await api.patch(`/dashboard/notifications/${id}/read`);
  },

  markAllNotificationsRead: async () => {
    return await api.patch('/dashboard/notifications/read-all');
  },

  deleteNotification: async (id) => {
    return await api.delete(`/dashboard/notifications/${id}`);
  },
};

export default dashboardAPI;
