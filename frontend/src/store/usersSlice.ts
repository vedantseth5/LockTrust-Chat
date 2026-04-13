import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../types'

interface UsersState {
  users: User[]
}

const initialState: UsersState = { users: [] }

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<User[]>) {
      state.users = action.payload
    },
    updateUserPresence(state, action: PayloadAction<{ userId: number; presence: string; customMessage?: string }>) {
      const user = state.users.find(u => u.id === action.payload.userId)
      if (user) {
        user.presence = action.payload.presence as User['presence']
        user.customStatusMessage = action.payload.customMessage
      }
    },
  },
})

export const { setUsers, updateUserPresence } = usersSlice.actions
export default usersSlice.reducer
