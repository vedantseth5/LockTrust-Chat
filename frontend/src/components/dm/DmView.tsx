import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setMessages, addMessage, updateMessage } from '../../store/dmSlice'
import { dmApi } from '../../api/dmApi'
import { reactionApi } from '../../api/reactionApi'
import UserAvatar from '../shared/UserAvatar'
import ProfileCard from '../shared/ProfileCard'
import EmojiPickerPopover from '../messaging/EmojiPickerPopover'
import MessageInput from '../messaging/MessageInput'
import { DirectMessage, User } from '../../types'
import { formatMessageDate, formatMessageTime } from '../../utils/date'
import { parseMentions } from '../../utils/mentions'
import clsx from 'clsx'

export default function DmView() {
  const dispatch = useDispatch()
  const currentUser = useSelector((s: RootState) => s.auth.user)
  const { conversations, activeConvId, messages } = useSelector((s: RootState) => s.dm)
  const allUsers = useSelector((s: RootState) => s.users.users)

  const conv = conversations.find(c => c.id === activeConvId)
  const convMessages = activeConvId ? messages[activeConvId] || [] : []
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  const [replyTo, setReplyTo] = useState<DirectMessage | null>(null)
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const profileAnchorRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!activeConvId) return
    const convId = activeConvId
    function fetchMessages() {
      dmApi.getMessages(convId).then(res => {
        const fetched: DirectMessage[] = res.data.content || res.data
        dispatch(setMessages({ convId, messages: fetched }))
      })
    }
    fetchMessages()
    pollRef.current = setInterval(fetchMessages, 2000)
    return () => clearInterval(pollRef.current)
  }, [activeConvId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convMessages.length])

  // Clear reply when switching conversations
  useEffect(() => { setReplyTo(null) }, [activeConvId])

  async function handleSend(content: string) {
    if (!activeConvId) return
    const res = await dmApi.sendMessage(activeConvId, content, replyTo?.id)
    dispatch(addMessage(res.data))
    setReplyTo(null)
  }

  async function handleReaction(msgId: number, emoji: string) {
    const res = await reactionApi.toggleDmReaction(msgId, emoji)
    dispatch(updateMessage(res.data))
  }

  function openProfile(u: User, anchor: HTMLElement) {
    profileAnchorRef.current = anchor
    setProfileUser(u)
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
        {!conv.isGroup && otherParticipants[0] && (() => {
          const other = otherParticipants[0]
          const liveUser = allUsers.find(u => u.id === other.id)
          const ref = React.createRef<HTMLDivElement>()
          return (
            <div ref={ref}>
              <UserAvatar
                displayName={other.displayName}
                avatarColor={other.avatarColor}
                size="sm"
                presence={liveUser?.presence}
                onClick={() => ref.current && openProfile(liveUser || other, ref.current)}
              />
            </div>
          )
        })()}
        <div>
          <div className="font-bold text-gray-900">{headerTitle}</div>
          {!conv.isGroup && otherParticipants[0] && (() => {
            const other = allUsers.find(u => u.id === otherParticipants[0].id)
            const presenceLabel: Record<string, string> = { ONLINE: 'Online', AWAY: 'Away', DND: 'Do not disturb', OFFLINE: 'Offline' }
            return <div className="text-xs text-gray-400">{presenceLabel[other?.presence || 'OFFLINE'] || 'Offline'}</div>
          })()}
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
        {convMessages.map((msg) => {
          const msgDate = formatMessageDate(msg.createdAt)
          const showDate = msgDate !== lastDate
          lastDate = msgDate
          const isOwn = msg.senderId === currentUser?.id
          const sender = allUsers.find(u => u.id === msg.senderId) || conv.participants.find(p => p.id === msg.senderId)
          const avatarRef = React.createRef<HTMLDivElement>()

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-semibold text-gray-400">{msgDate}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}
              <DmMessage
                msg={msg}
                isOwn={isOwn}
                sender={sender as User | undefined}
                currentUserId={currentUser?.id}
                allUsers={allUsers}
                onReply={() => setReplyTo(msg)}
                onReaction={(emoji) => handleReaction(msg.id, emoji)}
                onOpenProfile={openProfile}
                profileAnchorRef={profileAnchorRef}
                setProfileUser={setProfileUser}
              />
            </React.Fragment>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply banner */}
      {replyTo && (
        <div className="mx-4 mb-1 flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2 text-xs text-gray-600">
          <svg className="w-3 h-3 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
          </svg>
          <span className="flex-1 truncate">
            <span className="font-semibold text-brand-600">{replyTo.senderName}: </span>
            {replyTo.content}
          </span>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 ml-1">✕</button>
        </div>
      )}

      <MessageInput
        placeholder={`Message ${headerTitle}`}
        onSend={handleSend}
      />

      {profileUser && profileAnchorRef.current && (
        <ProfileCard
          user={profileUser}
          anchorRef={{ current: profileAnchorRef.current } as React.RefObject<HTMLElement>}
          onClose={() => setProfileUser(null)}
        />
      )}
    </div>
  )
}

// ── DM message row ────────────────────────────────────────────────────────────

function DmMessage({ msg, isOwn, sender, currentUserId, allUsers, onReply, onReaction, onOpenProfile, profileAnchorRef, setProfileUser }: {
  msg: DirectMessage
  isOwn: boolean
  sender: User | undefined
  currentUserId?: number
  allUsers: User[]
  onReply: () => void
  onReaction: (emoji: string) => void
  onOpenProfile: (u: User, anchor: HTMLElement) => void
  profileAnchorRef: React.MutableRefObject<HTMLElement | null>
  setProfileUser: (u: User | null) => void
}) {
  const avatarRef = useRef<HTMLDivElement>(null)
  const [showEmoji, setShowEmoji] = useState(false)

  return (
    <div className={`relative flex items-end gap-2 px-4 py-1 group ${isOwn ? 'flex-row-reverse' : ''}`}>
      <div ref={avatarRef} className="flex-shrink-0 mb-1">
        <UserAvatar
          displayName={msg.senderName}
          avatarColor={msg.senderAvatarColor}
          size="sm"
          presence={sender?.presence}
          onClick={() => { if (sender && avatarRef.current) onOpenProfile(sender, avatarRef.current) }}
        />
      </div>

      <div className={`max-w-xs lg:max-w-md flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-baseline gap-2 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span
            className="text-xs font-semibold text-gray-700 cursor-pointer hover:underline"
            onClick={() => sender && avatarRef.current && onOpenProfile(sender, avatarRef.current)}
          >
            {msg.senderName}
          </span>
          <span className="text-xs text-gray-400">{formatMessageTime(msg.createdAt)}</span>
        </div>

        {/* Reply quote */}
        {msg.replyToContent && (
          <div className={`text-xs text-gray-500 bg-gray-100 border-l-2 border-gray-300 px-2 py-1 rounded mb-1 max-w-full truncate ${isOwn ? 'border-r-2 border-l-0' : ''}`}>
            <span className="font-semibold">{msg.replyToSenderName}: </span>
            {msg.replyToContent}
          </div>
        )}

        {/* Bubble */}
        <div className={`px-3 py-2 rounded-2xl text-sm ${isOwn ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
          {parseMentions(msg.content, allUsers, currentUserId, (u, anchor) => {
            profileAnchorRef.current = anchor
            setProfileUser(u)
          })}
          {msg.edited && <span className="text-xs opacity-60 ml-1">(edited)</span>}
        </div>

        {/* Reactions */}
        {msg.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {msg.reactions.map(r => (
              <button
                key={r.emoji}
                onClick={() => onReaction(r.emoji)}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors',
                  r.userIds.includes(currentUserId || 0)
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                )}
              >
                {r.emoji} <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover toolbar */}
      <div className={`absolute top-0 ${isOwn ? 'left-12' : 'right-12'} -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10`}>
        <div className="relative">
          <button
            onClick={() => setShowEmoji(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-base"
            title="React"
          >
            😊
          </button>
          {showEmoji && (
            <EmojiPickerPopover
              onSelect={emoji => { onReaction(emoji); setShowEmoji(false) }}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>
        <button
          onClick={onReply}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          title="Reply"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
