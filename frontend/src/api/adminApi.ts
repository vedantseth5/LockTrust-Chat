import api from './adminAxios'
import axios from 'axios'

export const adminApi = {
  login: (email: string) => axios.post('/api/auth/login', { email }),
  verifyOtp: (email: string, otp: string) =>
    axios.post('/api/auth/verify-otp', { email, otp, purpose: 'LOGIN' }),

  listUsers: () => api.get('/admin/users'),
  updateRole: (id: number, role: string) => api.put(`/admin/users/${id}/role`, { role }),

  listChannels: () => api.get('/admin/channels'),
  channelMessages: (id: number, page = 0) =>
    api.get(`/admin/channels/${id}/messages`, { params: { page, size: 50 } }),

  listDmConversations: () => api.get('/admin/dm/conversations'),
  dmMessages: (id: number, page = 0) =>
    api.get(`/admin/dm/conversations/${id}/messages`, { params: { page, size: 50 } }),

  search: (q: string) => api.get('/admin/search', { params: { q } }),
  userActivity: (id: number) => api.get(`/admin/users/${id}/activity`),
}
