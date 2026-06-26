import axiosClient from './axiosClient';

export const authApi = {
  login: (data) => axiosClient.post('/auth/login', data),
  register: (data) => axiosClient.post('/auth/register', data),
  getMe: () => axiosClient.get('/users/me'),
  updateTheme: (isDark) => axiosClient.patch('/users/me/theme', { isDark }),
  changePassword: (data) => axiosClient.post('/auth/change-password', data),
};
