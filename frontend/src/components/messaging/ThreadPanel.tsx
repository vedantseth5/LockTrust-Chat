import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { closeThread } from '../../store/uiSlice'
import { ThreadReply } from '../../types'
import { channelApi } from '../../api/channelApi'
import UserAvatar from '../shared/UserAvatar'
import MessageInput from './MessageInput'
import { formatMessageTime, formatFull } from '../../utils/date'
import { parseMentions } from '../../utils/mentions'

export default function ThreadPanel() {
  const dispatch = useDispatch()
  const { threadMessageId, threadChannelId } = useSelector((s: RootState) => s.ui)
  const channels = useSelector((s: RootState) => s.channel.channels)
  const messages = useSelector((s: RootState) =>
    threadChannelId ? s.channel.messages[threadChannelId] || [] : []
  )
  const allUsers = useSelector((s: RootState) => s.users.users)
  const parentMessage = messages.find(m => m.id === threadMessageId)
  const channel = channels.find(c => c.id === threadChannelId)

  const [replies, setReplies] = useState<ThreadReply[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!threadMessageId || !threadChannelId) return
    setLoading(true)
    channelApi.getReplies(threadChannelId, threadMessageId)
      .then(res => setReplies(res.data))
      .finally(() => setLoading(false))
  }, [threadMessageId, threadChannelId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies.length])

  async function sendReply(content: string) {
    if (!threadMessageId || !threadChannelId) return
    const res = await channelApi.addReply(threadChannelId, threadMessageId, content)
    setReplies(prev => [...prev, res.data])
  }

  if (!threadMessageId) return null

  return (
    <div className="w-80 border-l border-gray-200 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h3 className="font-bold text-gray-900">Thread</h3>
          {channel && (
            <p className="text-xs text-gray-400">#{channel.name}</p>
          )}
        </div>
        <button
          onClick={() => dispatch(closeThread())}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Parent message */}
        {parentMessage && (
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <UserAvatar
                displayName={parentMessage.senderName}
                avatarColor={parentMessage.senderAvatarColor}
                size="md"
                presence={allUsers.find(u => u.id === parentMessage.senderId)?.presence}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-sm text-gray-900">{parentMessage.senderName}</span>
                  <span className="text-xs text-gray-400" title={formatFull(parentMessage.createdAt)}>
                    {formatMessageTime(parentMessage.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                  {parseMentions(parentMessage.content)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Replies section */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {loading && <div className="text-sm text-gray-400 text-center py-4">Loading...</div>}

          <div className="space-y-4">
            {replies.map(reply => (
              <div key={reply.id} className="flex items-start gap-3">
                <UserAvatar
                  displayName={reply.senderName}
                  avatarColor={reply.senderAvatarColor}
                  size="sm"
                  presence={allUsers.find(u => u.id === reply.senderId)?.presence}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-bold text-sm text-gray-900">{reply.senderName}</span>
                    <span className="text-xs text-gray-400" title={formatFull(reply.createdAt)}>
                      {formatMessageTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                    {parseMentions(reply.content)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      <MessageInput placeholder="Reply..." onSend={sendReply} />
    </div>
  )
}
