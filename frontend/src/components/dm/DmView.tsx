import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setMessages, addMessage } from '../../store/dmSlice'
import { dmApi } from '../../api/dmApi'
import UserAvatar from '../shared/UserAvatar'
import MessageInput from '../messaging/MessageInput'
import { DirectMessage } from '../../types'
import { formatMessageDate, formatMessageTime } from '../../utils/date'
import { parseMentions } from '../../utils/mentions'

export default function DmView() {
  const dispatch = useDispatch()
  const currentUser = useSelector((s: RootState) => s.auth.user)
  const { conversations, activeConvId, messages } = useSelector((s: RootState) => s.dm)
  const allUsers = useSelector((s: RootState) => s.users.users)

  const conv = conversations.find(c => c.id === activeConvId)
  const convMessages = activeConvId ? messages[activeConvId] || [] : []

  useEffect(() => {
    if (!activeConvId) return
    dmApi.getMessages(activeConvId).then(res => {
      dispatch(setMessages({ convId: activeConvId, messages: res.data.content || res.data }))
    })
  }, [activeConvId, dispatch])

  async function handleSend(content: string) {
    if (!activeConvId) return
    const res = await dmApi.sendMessage(activeConvId, content)
    dispatch(addMessage(res.data))
  }

  if (!conv) return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="text-5xl mb-4">💬</div>
        <p className="text-lg font-medium">Select a conversation</p>
      </div>
    </div>
  )

  const otherParticipants = conv.participants.filter(p => p.id !== currentUser?.id)
  const headerTitle = conv.isGroup
    ? conv.name || otherParticipants.map(p => p.displayName).join(', ')
    : otherParticipants[0]?.displayName || 'Unknown'

  let lastDate = ''

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        {!conv.isGroup && otherParticipants[0] && (
          <UserAvatar
            displayName={otherParticipants[0].displayName}
            avatarColor={otherParticipants[0].avatarColor}
            size="sm"
            presence={allUsers.find(u => u.id === otherParticipants[0].id)?.presence}
          />
        )}
        <div>
          <div className="font-bold text-gray-900">{headerTitle}</div>
          {!conv.isGroup && otherParticipants[0] && (
            <div className="text-xs text-gray-400 capitalize">
              {allUsers.find(u => u.id === otherParticipants[0].id)?.presence?.toLowerCase() || 'offline'}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {convMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-4xl mb-2">👋</div>
            <p>Start a conversation with {headerTitle}</p>
          </div>
        )}
        {convMessages.map((msg, idx) => {
          const msgDate = formatMessageDate(msg.createdAt)
          const showDate = msgDate !== lastDate
          lastDate = msgDate
          const isOwn = msg.senderId === currentUser?.id
          const sender = allUsers.find(u => u.id === msg.senderId)

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-semibold text-gray-400">{msgDate}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}
              <div className={`flex items-start gap-3 px-4 py-1 hover:bg-gray-50 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                <UserAvatar
                  displayName={msg.senderName}
                  avatarColor={msg.senderAvatarColor}
                  size="sm"
                  presence={sender?.presence}
                />
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`flex items-baseline gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold text-gray-700">{msg.senderName}</span>
                    <span className="text-xs text-gray-400">{formatMessageTime(msg.createdAt)}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isOwn ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
                    {parseMentions(msg.content)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          )
        })}
      </div>

      <MessageInput
        placeholder={`Message ${headerTitle}`}
        onSend={handleSend}
      />
    </div>
  )
}
