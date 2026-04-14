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
      const existing = state.messages[action.payload.convId] || []
      const fetched = action.payload.messages

      // Collect all unique messages by id
      const byId = new Map<number, DirectMessage>()
      existing.forEach(m => byId.set(m.id, m))
      fetched.forEach(m => byId.set(m.id, m))

      const merged = Array.from(byId.values())
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      // Skip update if nothing changed
      if (merged.length === existing.length && merged.every((m, i) => m.id === existing[i]?.id)) return

      state.messages[action.payload.convId] = merged
    },
    addMessage(state, action: PayloadAction<DirectMessage>) {
      const { conversationId } = action.payload
      if (!state.messages[conversationId]) state.messages[conversationId] = []
      const already = state.messages[conversationId].some(m => m.id === action.payload.id)
      if (already) return
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
