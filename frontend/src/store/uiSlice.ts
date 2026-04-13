import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Notification {
  id: string
  type: 'mention' | 'info'
  message: string
  channelId?: number
  channelName?: string
}

interface UiState {
  threadMessageId: number | null
  threadChannelId: number | null
  notifications: Notification[]
  typingUsers: Record<number, { userId: number; displayName: string; ts: number }[]>
}

const initialState: UiState = {
  threadMessageId: null,
  threadChannelId: null,
  notifications: [],
  typingUsers: {},
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openThread(state, action: PayloadAction<{ messageId: number; channelId: number }>) {
      state.threadMessageId = action.payload.messageId
      state.threadChannelId = action.payload.channelId
    },
    closeThread(state) {
      state.threadMessageId = null
      state.threadChannelId = null
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.push(action.payload)
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    setTyping(state, action: PayloadAction<{ channelId: number; userId: number; displayName: string; isTyping: boolean }>) {
      const { channelId, userId, displayName, isTyping } = action.payload
      if (!state.typingUsers[channelId]) state.typingUsers[channelId] = []
      if (isTyping) {
        const exists = state.typingUsers[channelId].find(u => u.userId === userId)
        if (!exists) state.typingUsers[channelId].push({ userId, displayName, ts: Date.now() })
      } else {
        state.typingUsers[channelId] = state.typingUsers[channelId].filter(u => u.userId !== userId)
      }
    },
  },
})

export const { openThread, closeThread, addNotification, removeNotification, setTyping } = uiSlice.actions
export default uiSlice.reducer
