import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setChannels, setActiveChannel } from '../store/channelSlice'
import { setConversations } from '../store/dmSlice'
import { setUsers } from '../store/usersSlice'
import { setAuth, updatePresence } from '../store/authSlice'
import { updateUserPresence } from '../store/usersSlice'
import { channelApi } from '../api/channelApi'
import { dmApi } from '../api/dmApi'
import { userApi } from '../api/userApi'
import { connectSocket, disconnectSocket } from '../socket/socketClient'
import { store } from '../store'
import Sidebar from '../components/sidebar/Sidebar'
import ChannelView from '../components/channel/ChannelView'
import DmView from '../components/dm/DmView'
import ThreadPanel from '../components/messaging/ThreadPanel'

const AWAY_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes of inactivity → AWAY

export default function WorkspacePage() {
  const dispatch = useDispatch()
  const { user, token } = useSelector((s: RootState) => s.auth)
  const activeChannelId = useSelector((s: RootState) => s.channel.activeChannelId)
  const activeConvId = useSelector((s: RootState) => s.dm.activeConvId)
  const threadMessageId = useSelector((s: RootState) => s.ui.threadMessageId)
  const pollRef = useRef<ReturnType<typeof setInterval>>()
  const awayTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const isAwayRef = useRef(false)


  useEffect(() => {
    if (!token || !user) return

    Promise.all([
      channelApi.getAll(),
      dmApi.getConversations(),
      userApi.getAll(),
    ]).then(([channelsRes, dmsRes, usersRes]) => {
      const allChannels = channelsRes.data
      dispatch(setChannels(allChannels))
      dispatch(setConversations(dmsRes.data))
      dispatch(setUsers(usersRes.data))

      const myChannels: { id: number; memberIds: number[] }[] = allChannels.filter(
        (ch: { memberIds: number[] }) => ch.memberIds.includes(user.id)
      )
      // Only auto-select the first channel if nothing is already open
      const currentActive = store.getState().channel.activeChannelId
      if (!currentActive && myChannels.length > 0) {
        dispatch(setActiveChannel(myChannels[0].id))
      }

      const myChannelIds = myChannels.map((ch) => ch.id)
      connectSocket(token, myChannelIds)
    })

    pollRef.current = setInterval(() => {
      userApi.getAll().then(res => dispatch(setUsers(res.data)))
      dmApi.getConversations().then(res => dispatch(setConversations(res.data)))
    }, 15000)

    return () => {
      clearInterval(pollRef.current)
      disconnectSocket()
    }
  }, [token, user?.id])

  // Auto-away on inactivity, back to online on activity
  useEffect(() => {
    if (!token || !user) return
    const userId = user.id

    function getCurrentUser() {
      return store.getState().auth.user
    }

    function goAway() {
      if (isAwayRef.current) return
      const u = getCurrentUser()
      if (!u || u.presence === 'DND' || u.presence === 'OFFLINE') return
      isAwayRef.current = true
      userApi.updateStatus('AWAY', u.customStatusMessage || '')
      dispatch(updatePresence({ userId, presence: 'AWAY', customMessage: u.customStatusMessage || '' }))
      dispatch(updateUserPresence({ userId, presence: 'AWAY', customMessage: u.customStatusMessage || '' }))
    }

    function goOnline() {
      clearTimeout(awayTimerRef.current)
      awayTimerRef.current = setTimeout(goAway, AWAY_TIMEOUT_MS)
      if (!isAwayRef.current) return
      const u = getCurrentUser()
      if (!u || u.presence === 'DND' || u.presence === 'OFFLINE') return
      isAwayRef.current = false
      userApi.updateStatus('ONLINE', u.customStatusMessage || '')
      dispatch(updatePresence({ userId, presence: 'ONLINE', customMessage: u.customStatusMessage || '' }))
      dispatch(updateUserPresence({ userId, presence: 'ONLINE', customMessage: u.customStatusMessage || '' }))
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, goOnline, { passive: true }))
    awayTimerRef.current = setTimeout(goAway, AWAY_TIMEOUT_MS)

    return () => {
      events.forEach(e => window.removeEventListener(e, goOnline))
      clearTimeout(awayTimerRef.current)
    }
  }, [token, user?.id])

  const showNothing = !activeChannelId && !activeConvId

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />

      <div className="flex flex-1 min-w-0 h-full">
        {showNothing && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 60 60" fill="none">
                  <path d="M10 20h30M10 28h30M10 36h20" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M38 16h12M38 24h12M38 32h12M38 40h12" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to LockTrust</h2>
              <p className="text-sm text-gray-500">Select a channel or start a direct message from the sidebar to begin.</p>
            </div>
          </div>
        )}

        {activeChannelId && <ChannelView />}
        {activeConvId && !activeChannelId && <DmView />}

        {threadMessageId && <ThreadPanel />}
      </div>
    </div>
  )
}
