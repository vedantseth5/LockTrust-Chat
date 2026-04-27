import api from './axiosInstance'

export const channelApi = {
  getAll: () => api.get('/channels'),
  getOne: (id: number) => api.get(`/channels/${id}`),
  create: (name: string, description: string, isPrivate: boolean) =>
    api.post('/channels', { name, description, isPrivate }),
  join: (id: number) => api.post(`/channels/${id}/join`),
  leave: (id: number) => api.delete(`/channels/${id}/leave`),
  getMembers: (id: number) => api.get(`/channels/${id}/members`),
  addMember: (channelId: number, userId: number) =>
    api.post(`/channels/${channelId}/members`, { userId }),

  getMessages: (channelId: number, page = 0, size = 50) =>
    api.get(`/channels/${channelId}/messages`, { params: { page, size } }),
  sendMessage: (channelId: number, content: string) =>
    api.post(`/channels/${channelId}/messages`, { content }),
  editMessage: (channelId: number, messageId: number, content: string) =>
    api.put(`/channels/${channelId}/messages/${messageId}`, { content }),
  deleteMessage: (channelId: number, messageId: number) =>
    api.delete(`/channels/${channelId}/messages/${messageId}`),

  getReplies: (channelId: number, messageId: number) =>
    api.get(`/channels/${channelId}/messages/${messageId}/replies`),
  addReply: (channelId: number, messageId: number, content: string) =>
    api.post(`/channels/${channelId}/messages/${messageId}/replies`, { content }),
}
