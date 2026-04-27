import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setMessages } from '../../store/channelSlice'
import { channelApi } from '../../api/channelApi'
import { subscribeToChannel } from '../../socket/socketClient'
import MessageFeed from '../messaging/MessageFeed'
import MessageInput from '../messaging/MessageInput'
import ChannelMembersPanel from './ChannelMembersPanel'
import InviteToChannelModal from './InviteToChannelModal'

export default function ChannelView() {
  const dispatch = useDispatch()
  const { user } = useSelector((s: RootState) => s.auth)
  const activeChannelId = useSelector((s: RootState) => s.channel.activeChannelId)
  const channels = useSelector((s: RootState) => s.channel.channels)
  const messages = useSelector((s: RootState) =>
    activeChannelId ? s.channel.messages[activeChannelId] || [] : []
  )
  const typingUsers = useSelector((s: RootState) =>
    activeChannelId ? s.ui.typingUsers[activeChannelId] || [] : []
  )
  const [showMembers, setShowMembers] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [loading, setLoading] = useState(false)

  const allUsers = useSelector((s: RootState) => s.users.users)
  const channel = channels.find(c => c.id === activeChannelId)
  const isMember = channel && user ? channel.memberIds.includes(user.id) : false
  const channelMembers = channel ? allUsers.filter(u => channel.memberIds.includes(u.id)) : []
  const canInvite = isMember

  useEffect(() => {
    if (!activeChannelId) return
    setLoading(true)
    channelApi.getMessages(activeChannelId).then(res => {
      const msgs = res.data.content || res.data
      dispatch(setMessages({ channelId: activeChannelId, messages: msgs }))
      subscribeToChannel(activeChannelId)
    }).finally(() => setLoading(false))
  }, [activeChannelId, dispatch])

  async function handleSend(content: string) {
    if (!activeChannelId) return
    // WS broadcast will deliver the message to all subscribers including sender
    await channelApi.sendMessage(activeChannelId, content)
  }

  if (!channel) return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="text-5xl mb-4">👈</div>
        <p className="text-lg font-medium">Select a channel to start chatting</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-1 min-w-0 h-full">
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold text-lg">{channel.isPrivate ? '🔒' : '#'}</span>
            <span className="font-bold text-gray-900 text-lg">{channel.name}</span>
            {channel.isPrivate && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Private</span>
            )}
            {channel.description && (
              <>
                <span className="text-gray-200">|</span>
                <span className="text-gray-500 text-sm truncate max-w-xs">{channel.description}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {canInvite && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                title="Invite people"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                Invite
              </button>
            )}
            <button
              onClick={() => setShowMembers(v => !v)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              title="Members"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {channel.memberCount}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading messages...</div>
        ) : (
          <MessageFeed
            messages={messages}
            channelId={activeChannelId!}
            typingUsers={typingUsers}
          />
        )}

        <MessageInput
          placeholder={`Message #${channel.name}`}
          onSend={handleSend}
          channelId={activeChannelId!}
          channelMembers={channelMembers}
        />
      </div>

      {showMembers && (
        <ChannelMembersPanel channelId={channel.id} onClose={() => setShowMembers(false)} />
      )}

      <InviteToChannelModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        channelId={channel.id}
      />
    </div>
  )
}
