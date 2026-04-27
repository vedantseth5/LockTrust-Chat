import api from './axiosInstance'

export const userApi = {
  getMe: () => api.get('/users/me'),
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  search: (q: string) => api.get('/users/search', { params: { q } }),
  updateStatus: (presence: string, customMessage?: string) =>
    api.put('/users/me/status', { presence, customMessage }),
  updateProfile: (data: { displayName?: string; email?: string; title?: string; timezone?: string; avatarColor?: string }) =>
    api.put('/users/me/profile', data),
}
