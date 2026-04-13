import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setChannels, setActiveChannel } from '../store/channelSlice'
import { setConversations } from '../store/dmSlice'
import { setUsers } from '../store/usersSlice'
import { channelApi } from '../api/channelApi'
import { dmApi } from '../api/dmApi'
import { userApi } from '../api/userApi'
import { connectSocket, disconnectSocket } from '../socket/socketClient'
import Sidebar from '../components/sidebar/Sidebar'
import ChannelView from '../components/channel/ChannelView'
import DmView from '../components/dm/DmView'
import ThreadPanel from '../components/messaging/ThreadPanel'

export default function WorkspacePage() {
  const dispatch = useDispatch()
  const { user, token } = useSelector((s: RootState) => s.auth)
  const activeChannelId = useSelector((s: RootState) => s.channel.activeChannelId)
  const activeConvId = useSelector((s: RootState) => s.dm.activeConvId)
  const threadMessageId = useSelector((s: RootState) => s.ui.threadMessageId)

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

      // Auto-select #general (or first channel user is member of)
      const myChannels: { id: number; memberIds: number[] }[] = allChannels.filter(
        (ch: { memberIds: number[] }) => ch.memberIds.includes(user.id)
      )
      if (myChannels.length > 0) {
        dispatch(setActiveChannel(myChannels[0].id))
      }

      const myChannelIds = myChannels.map((ch) => ch.id)
      connectSocket(token, myChannelIds)
    })

    return () => {
      disconnectSocket()
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
