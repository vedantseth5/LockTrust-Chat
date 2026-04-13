import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { sendTyping } from '../../socket/socketClient'
import clsx from 'clsx'

interface Props {
  placeholder: string
  onSend: (content: string) => Promise<void>
  channelId?: number
}

export default function MessageInput({ placeholder, onSend, channelId }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>()
  const user = useSelector((s: RootState) => s.auth.user)

  function autoResize() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    autoResize()

    if (channelId && user) {
      sendTyping(channelId, user.id, user.displayName, true)
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => {
        sendTyping(channelId, user.id, user.displayName, false)
      }, 2000)
    }
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await onSend(trimmed)
      setText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    textareaRef.current?.focus()
  }, [channelId])

  return (
    <div className="px-4 py-3">
      <div className="flex items-end gap-2 bg-gray-100 rounded-xl border border-gray-200 px-4 py-2 focus-within:border-brand-400 focus-within:bg-white transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-gray-900 placeholder-gray-400 text-sm leading-6 max-h-44 scrollbar-thin py-1"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className={clsx(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors mb-0.5',
            text.trim() && !sending
              ? 'bg-brand-600 hover:bg-brand-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
          title="Send (Enter)"
        >
          <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 px-1">
        <strong>Enter</strong> to send · <strong>Shift+Enter</strong> for new line
      </p>
    </div>
  )
}
