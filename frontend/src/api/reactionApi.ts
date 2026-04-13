import api from './axiosInstance'

export const reactionApi = {
  toggleMessageReaction: (messageId: number, emoji: string) =>
    api.post(`/messages/${messageId}/reactions`, { emoji }),
  toggleReplyReaction: (replyId: number, emoji: string) =>
    api.post(`/replies/${replyId}/reactions`, { emoji }),
}
