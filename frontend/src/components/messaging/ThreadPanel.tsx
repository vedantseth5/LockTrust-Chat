import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { closeThread } from '../../store/uiSlice'
import { ThreadReply, Message } from '../../types'
import { channelApi } from '../../api/channelApi'
import { reactionApi } from '../../api/reactionApi'
import UserAvatar from '../shared/UserAvatar'
import MessageInput from './MessageInput'
import { formatMessageTime, formatFull } from '../../utils/date'
import { parseMentions } from '../../utils/mentions'

export default function ThreadPanel() {
  const dispatch = useDispatch()
  const { threadMessageId, threadChannelId } = useSelector((s: RootState) => s.ui)
  const messages = useSelector((s: RootState) =>
    threadChannelId ? s.channel.messages[threadChannelId] || [] : []
  )
  const parentMessage = messages.find(m => m.id === threadMessageId)

  const [replies, setReplies] = useState<ThreadReply[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!threadMessageId || !threadChannelId) return
    setLoading(true)
    channelApi.getReplies(threadChannelId, threadMessageId)
      .then(res => setReplies(res.data))
      .finally(() => setLoading(false))
  }, [threadMessageId, threadChannelId])

  async function sendReply(content: string) {
    if (!threadMessageId || !threadChannelId) return
    const res = await channelApi.addReply(threadChannelId, threadMessageId, content)
    setReplies(prev => [...prev, res.data])
  }

  if (!threadMessageId) return null

  return (
    <div className="w-80 border-l border-gray-200 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h3 className="font-bold text-gray-900">Thread</h3>
          {parentMessage && (
            <p className="text-xs text-gray-400">in #{parentMessage.channelId}</p>
          )}
        </div>
        <button
          onClick={() => dispatch(closeThread())}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Parent message */}
        {parentMessage && (
          <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <UserAvatar
                displayName={parentMessage.senderName}
                avatarColor={parentMessage.senderAvatarColor}
                size="sm"
              />
              <div>
                <span className="font-semibold text-sm text-gray-900">{parentMessage.senderName}</span>
                <span className="text-xs text-gray-400 ml-2">{formatMessageTime(parentMessage.createdAt)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-700">{parseMentions(parentMessage.content)}</p>
          </div>
        )}

        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </div>

        {loading && <div className="text-sm text-gray-400">Loading...</div>}

        {replies.map(reply => (
          <div key={reply.id} className="flex items-start gap-2">
            <UserAvatar
              displayName={reply.senderName}
              avatarColor={reply.senderAvatarColor}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-gray-900">{reply.senderName}</span>
                <span className="text-xs text-gray-400">{formatMessageTime(reply.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{parseMentions(reply.content)}</p>
            </div>
          </div>
        ))}
      </div>

      <MessageInput
        placeholder="Reply..."
        onSend={sendReply}
      />
    </div>
  )
}
