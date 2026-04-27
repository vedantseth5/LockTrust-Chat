import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('lt_token'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user
      state.token = action.payload.token
      localStorage.setItem('lt_token', action.payload.token)
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) Object.assign(state.user, action.payload)
    },
    updatePresence(state, action: PayloadAction<{ userId: number; presence: string; customMessage?: string }>) {
      if (state.user && state.user.id === action.payload.userId) {
        state.user.presence = action.payload.presence as User['presence']
        state.user.customStatusMessage = action.payload.customMessage
      }
    },
    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem('lt_token')
    },
  },
})

export const { setAuth, updateUser, updatePresence, logout } = authSlice.actions
export default authSlice.reducer
