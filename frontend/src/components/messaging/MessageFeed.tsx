import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Message } from '../../types'
import MessageItem from './MessageItem'
import { formatMessageDate } from '../../utils/date'
import { channelApi } from '../../api/channelApi'
import { updateMessage, deleteMessage } from '../../store/channelSlice'

interface Props {
  messages: Message[]
  channelId: number
  typingUsers?: { userId: number; displayName: string }[]
}

export default function MessageFeed({ messages, channelId, typingUsers = [] }: Props) {
  const dispatch = useDispatch()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleEdit(messageId: number, content: string) {
    const res = await channelApi.editMessage(channelId, messageId, content)
    dispatch(updateMessage(res.data))
  }

  async function handleDelete(messageId: number) {
    await channelApi.deleteMessage(channelId, messageId)
    dispatch(deleteMessage({ messageId, channelId }))
  }

  // Group by date, collapse consecutive same-sender messages
  let lastDate = ''
  let lastSenderId = -1

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <div className="text-4xl mb-2">💬</div>
          <p className="font-medium">No messages yet</p>
          <p className="text-sm">Be the first to say something!</p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const msgDate = formatMessageDate(msg.createdAt)
        const showDateDivider = msgDate !== lastDate
        const showHeader = showDateDivider || msg.senderId !== lastSenderId
        lastDate = msgDate
        lastSenderId = msg.senderId

        return (
          <React.Fragment key={msg.id}>
            {showDateDivider && (
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">{msgDate}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}
            <MessageItem
              message={msg}
              showHeader={showHeader}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </React.Fragment>
        )
      })}

      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-sm text-gray-400 italic flex items-center gap-2">
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          {typingUsers.map(u => u.displayName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
