import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DmConversation, DirectMessage } from '../types'

interface DmState {
  conversations: DmConversation[]
  activeConvId: number | null
  messages: Record<number, DirectMessage[]>
  unread: Record<number, number>
}

const initialState: DmState = {
  conversations: [],
  activeConvId: null,
  messages: {},
  unread: {},
}

const dmSlice = createSlice({
  name: 'dm',
  initialState,
  reducers: {
    setConversations(state, action: PayloadAction<DmConversation[]>) {
      state.conversations = action.payload
    },
    addConversation(state, action: PayloadAction<DmConversation>) {
      if (!state.conversations.find(c => c.id === action.payload.id)) {
        state.conversations.push(action.payload)
      }
    },
    setActiveConv(state, action: PayloadAction<number | null>) {
      state.activeConvId = action.payload
      if (action.payload !== null) state.unread[action.payload] = 0
    },
    setMessages(state, action: PayloadAction<{ convId: number; messages: DirectMessage[] }>) {
      state.messages[action.payload.convId] = action.payload.messages
    },
    addMessage(state, action: PayloadAction<DirectMessage>) {
      const { conversationId } = action.payload
      if (!state.messages[conversationId]) state.messages[conversationId] = []
      state.messages[conversationId].push(action.payload)
      if (state.activeConvId !== conversationId) {
        state.unread[conversationId] = (state.unread[conversationId] || 0) + 1
      }
    },
    updateMessage(state, action: PayloadAction<DirectMessage>) {
      const msgs = state.messages[action.payload.conversationId]
      if (msgs) {
        const idx = msgs.findIndex(m => m.id === action.payload.id)
        if (idx >= 0) msgs[idx] = action.payload
      }
    },
  },
})

export const { setConversations, addConversation, setActiveConv, setMessages, addMessage, updateMessage } = dmSlice.actions
export default dmSlice.reducer
