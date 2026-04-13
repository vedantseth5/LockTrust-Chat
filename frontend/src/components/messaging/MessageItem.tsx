import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { openThread } from '../../store/uiSlice'
import { Message } from '../../types'
import UserAvatar from '../shared/UserAvatar'
import { formatMessageTime, formatFull } from '../../utils/date'
import { parseMentions } from '../../utils/mentions'
import { channelApi } from '../../api/channelApi'
import { reactionApi } from '../../api/reactionApi'
import EmojiPickerPopover from './EmojiPickerPopover'
import clsx from 'clsx'

interface Props {
  message: Message
  showHeader: boolean
  onEdit?: (messageId: number, content: string) => void
  onDelete?: (messageId: number) => void
}

export default function MessageItem({ message, showHeader, onEdit, onDelete }: Props) {
  const dispatch = useDispatch()
  const currentUser = useSelector((s: RootState) => s.auth.user)
  const allUsers = useSelector((s: RootState) => s.users.users)
  const sender = allUsers.find(u => u.id === message.senderId)

  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const isOwn = currentUser?.id === message.senderId

  async function saveEdit() {
    if (!editText.trim()) return
    onEdit?.(message.id, editText)
    setEditing(false)
  }

  async function handleReaction(emoji: string) {
    await reactionApi.toggleMessageReaction(message.id, emoji)
    setShowEmojiPicker(false)
  }

  if (message.deleted) {
    return (
      <div className="px-4 py-0.5 text-gray-400 italic text-sm flex items-center gap-2 pl-16">
        [This message was deleted]
      </div>
    )
  }

  return (
    <div
      className={clsx('group relative px-4 py-0.5 hover:bg-gray-50 transition-colors', showHeader && 'mt-3')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowEmojiPicker(false) }}
    >
      <div className="flex items-start gap-3">
        {showHeader ? (
          <UserAvatar
            displayName={message.senderName}
            avatarColor={message.senderAvatarColor}
            size="md"
            presence={sender?.presence}
          />
        ) : (
          <div className="w-9 flex-shrink-0 flex items-center justify-center">
            {hovered && (
              <span className="text-gray-400 text-xs">{formatMessageTime(message.createdAt)}</span>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {showHeader && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-bold text-gray-900 text-sm">{message.senderName}</span>
              <span className="text-gray-400 text-xs" title={formatFull(message.createdAt)}>
                {formatMessageTime(message.createdAt)}
              </span>
              {message.edited && <span className="text-gray-400 text-xs">(edited)</span>}
            </div>
          )}

          {editing ? (
            <div className="mt-1">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                  if (e.key === 'Escape') setEditing(false)
                }}
                autoFocus
                className="w-full border border-brand-400 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
                rows={2}
              />
              <div className="flex gap-2 mt-1 text-xs">
                <button onClick={saveEdit} className="text-brand-600 hover:underline font-medium">Save</button>
                <span className="text-gray-300">·</span>
                <button onClick={() => setEditing(false)} className="text-gray-500 hover:underline">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
              {parseMentions(message.content)}
            </p>
          )}

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => handleReaction(r.emoji)}
                  className={clsx(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors',
                    r.userIds.includes(currentUser?.id || 0)
                      ? 'bg-brand-50 border-brand-300 text-brand-700'
                      : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {r.emoji} <span>{r.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Reply count */}
          {message.replyCount > 0 && (
            <button
              onClick={() => dispatch(openThread({ messageId: message.id, channelId: message.channelId }))}
              className="text-brand-600 hover:text-brand-700 text-xs font-medium mt-1 hover:underline"
            >
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>

        {/* Action toolbar */}
        {hovered && !editing && (
          <div className="absolute right-4 top-0 -translate-y-1/2 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(v => !v)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-base"
                title="Add reaction"
              >
                😊
              </button>
              {showEmojiPicker && (
                <EmojiPickerPopover onSelect={handleReaction} onClose={() => setShowEmojiPicker(false)} />
              )}
            </div>
            <button
              onClick={() => dispatch(openThread({ messageId: message.id, channelId: message.channelId }))}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title="Reply in thread"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </button>
            {isOwn && (
              <>
                <button
                  onClick={() => { setEditing(true); setEditText(message.content) }}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  title="Edit message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  onClick={() => onDelete?.(message.id)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-gray-500 hover:text-red-500"
                  title="Delete message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
