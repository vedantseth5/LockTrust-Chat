import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Channel, Message } from '../types'

interface ChannelState {
  channels: Channel[]
  activeChannelId: number | null
  messages: Record<number, Message[]>
  unread: Record<number, number>
  loading: boolean
}

const initialState: ChannelState = {
  channels: [],
  activeChannelId: null,
  messages: {},
  unread: {},
  loading: false,
}

const channelSlice = createSlice({
  name: 'channel',
  initialState,
  reducers: {
    setChannels(state, action: PayloadAction<Channel[]>) {
      state.channels = action.payload
    },
    addChannel(state, action: PayloadAction<Channel>) {
      if (!state.channels.find(c => c.id === action.payload.id)) {
        state.channels.push(action.payload)
      }
    },
    updateChannel(state, action: PayloadAction<Channel>) {
      const idx = state.channels.findIndex(c => c.id === action.payload.id)
      if (idx >= 0) state.channels[idx] = action.payload
    },
    setActiveChannel(state, action: PayloadAction<number | null>) {
      state.activeChannelId = action.payload
      if (action.payload !== null) {
        state.unread[action.payload] = 0
      }
    },
    setMessages(state, action: PayloadAction<{ channelId: number; messages: Message[] }>) {
      state.messages[action.payload.channelId] = action.payload.messages
    },
    addMessage(state, action: PayloadAction<Message>) {
      const { channelId } = action.payload
      if (!state.messages[channelId]) state.messages[channelId] = []
      state.messages[channelId].push(action.payload)
      if (state.activeChannelId !== channelId) {
        state.unread[channelId] = (state.unread[channelId] || 0) + 1
      }
    },
    updateMessage(state, action: PayloadAction<Message>) {
      const msgs = state.messages[action.payload.channelId]
      if (msgs) {
        const idx = msgs.findIndex(m => m.id === action.payload.id)
        if (idx >= 0) msgs[idx] = action.payload
      }
    },
    deleteMessage(state, action: PayloadAction<{ messageId: number; channelId: number }>) {
      const msgs = state.messages[action.payload.channelId]
      if (msgs) {
        const idx = msgs.findIndex(m => m.id === action.payload.messageId)
        if (idx >= 0) msgs[idx].deleted = true
      }
    },
    updateReaction(state, action: PayloadAction<{ channelId: number; messageId: number; emoji: string; userId: number; count: number; type: string }>) {
      const msgs = state.messages[action.payload.channelId]
      if (!msgs) return
      const msg = msgs.find(m => m.id === action.payload.messageId)
      if (!msg) return
      const { emoji, userId, count, type } = action.payload
      const existing = msg.reactions.find(r => r.emoji === emoji)
      if (type === 'REACTION_ADD') {
        if (existing) {
          existing.count = count
          if (!existing.userIds.includes(userId)) existing.userIds.push(userId)
        } else {
          msg.reactions.push({ emoji, count, userIds: [userId] })
        }
      } else {
        if (existing) {
          existing.count = count
          existing.userIds = existing.userIds.filter(id => id !== userId)
          if (existing.count <= 0) msg.reactions = msg.reactions.filter(r => r.emoji !== emoji)
        }
      }
    },
    incrementReplyCount(state, action: PayloadAction<{ channelId: number; messageId: number }>) {
      const msgs = state.messages[action.payload.channelId]
      if (msgs) {
        const msg = msgs.find(m => m.id === action.payload.messageId)
        if (msg) msg.replyCount = (msg.replyCount || 0) + 1
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    updateMemberJoined(state, action: PayloadAction<{ channelId: number; userId: number }>) {
      const ch = state.channels.find(c => c.id === action.payload.channelId)
      if (ch && !ch.memberIds.includes(action.payload.userId)) {
        ch.memberIds.push(action.payload.userId)
        ch.memberCount += 1
      }
    },
    updateMemberLeft(state, action: PayloadAction<{ channelId: number; userId: number }>) {
      const ch = state.channels.find(c => c.id === action.payload.channelId)
      if (ch) {
        ch.memberIds = ch.memberIds.filter(id => id !== action.payload.userId)
        ch.memberCount = Math.max(0, ch.memberCount - 1)
      }
    },
  },
})

export const {
  setChannels, addChannel, updateChannel, setActiveChannel,
  setMessages, addMessage, updateMessage, deleteMessage,
  updateReaction, incrementReplyCount, setLoading,
  updateMemberJoined, updateMemberLeft,
} = channelSlice.actions
export default channelSlice.reducer
