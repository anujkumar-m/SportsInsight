import api from './api';

const authAPI = {
  login: (identifier, password) =>
    api.post('/auth/login', { identifier, password }).then((r) => r.data),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }),

  refreshToken: (refreshToken) =>
    api.post('/auth/refresh-token', { refreshToken }).then((r) => r.data),

  getProfile: () =>
    api.get('/auth/profile').then((r) => r.data),

  updateProfile: (data) =>
    api.put('/auth/profile', data).then((r) => r.data),

  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }),

  // Google OAuth
  googleLogin: (credential) =>
    api.post('/auth/google', { credential }).then((r) => r.data),

  // Admin: Google user management
  getGoogleUsers: () =>
    api.get('/auth/google-users').then((r) => r.data),

  assignRole: (userId, roleId) =>
    api.put('/auth/assign-role', { userId, roleId }).then((r) => r.data),
};

export default authAPI;


