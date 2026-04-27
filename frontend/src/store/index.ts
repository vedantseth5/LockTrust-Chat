import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import channelReducer from './channelSlice'
import dmReducer from './dmSlice'
import usersReducer from './usersSlice'
import uiReducer from './uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    channel: channelReducer,
    dm: dmReducer,
    users: usersReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
