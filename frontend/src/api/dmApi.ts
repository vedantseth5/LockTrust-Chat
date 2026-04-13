import api from './axiosInstance'

export const dmApi = {
  getConversations: () => api.get('/dm/conversations'),
  createConversation: (participantIds: number[], name?: string) =>
    api.post('/dm/conversations', { participantIds, name }),
  getMessages: (convId: number, page = 0, size = 50) =>
    api.get(`/dm/conversations/${convId}/messages`, { params: { page, size } }),
  sendMessage: (convId: number, content: string) =>
    api.post(`/dm/conversations/${convId}/messages`, { content }),
  editMessage: (convId: number, msgId: number, content: string) =>
    api.put(`/dm/conversations/${convId}/messages/${msgId}`, { content }),
  deleteMessage: (convId: number, msgId: number) =>
    api.delete(`/dm/conversations/${convId}/messages/${msgId}`),
}
